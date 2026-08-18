"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";

type DoctorOption = {
  id: string;
  name: string;
  email: string | null;
};

// Estrutura para o Slot da escala
type ShiftSlot = {
  shiftId: number | null;
  userId: string;
  isChief: boolean;
  badge: string;
};

type PeriodKey = "manha" | "tarde" | "noite";

type LegacyPeriodKey = PeriodKey | "24h";

type ShiftRow = {
  id: number;
  period: LegacyPeriodKey;
  doctor_user_id: string | null;
  is_chief: boolean;
  badge: string | null;
};

type AvailabilityRow = {
  user_id: string;
  period: PeriodKey;
};

type ActiveSwapRequest = {
  id: number;
  from_shift_id: number;
  target_user_id: string | null;
  reason: string | null;
};

const ALLOWED_PERIODS: PeriodKey[] = ["manha", "tarde", "noite"];

const ACTIVE_SWAP_MESSAGE =
  "Este plantão está anunciado no momento. Cancele o anúncio antes de alterar o médico ou remover o plantão.";
const AWAITING_COORDINATION_MESSAGE =
  "Este anúncio já foi aceito. Confirme ou rejeite a solicitação no painel de Solicitações antes de alterar o plantão.";
const PROTECTION_CHECK_FAILED_MESSAGE =
  "Não foi possível verificar se existem ofertas ou solicitações ativas. Atualize a página e tente novamente.";
const ADMIN_CANCEL_CONFIRMATION = "CANCELAR ANUNCIO DO PLANTAO";

const PERIODS: {
  key: PeriodKey;
  label: string;
  maxDoctors: number;
}[] = [
  { key: "manha", label: "Manhã", maxDoctors: 8 },
  { key: "tarde", label: "Tarde", maxDoctors: 8 },
  { key: "noite", label: "Noite", maxDoctors: 4 },
];

function isAllowedPeriod(period: string): period is PeriodKey {
  return ALLOWED_PERIODS.includes(period as PeriodKey);
}

function EditarPlantaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>("Hospital");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [protectedShiftIds, setProtectedShiftIds] = useState<Set<number>>(
    new Set(),
  );
  const [cancellableRequestIdsByShiftId, setCancellableRequestIdsByShiftId] =
    useState<Map<number, number[]>>(new Map());
  const [cancellingShiftId, setCancellingShiftId] = useState<number | null>(
    null,
  );

  // PATCH: controla se o input do badge está “aberto” por linha
  const [badgeOpen, setBadgeOpen] = useState<Record<string, boolean>>({});

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  // Slots de cada período
  const [manhaDoctors, setManhaDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: "", isChief: false, badge: "" },
  ]);
  const [tardeDoctors, setTardeDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: "", isChief: false, badge: "" },
  ]);
  const [noiteDoctors, setNoiteDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: "", isChief: false, badge: "" },
  ]);

  const [copyTargetDate, setCopyTargetDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
    );
  }, [doctors]);

  function protectedShiftMessage(shiftId: number) {
    return cancellableRequestIdsByShiftId.has(shiftId)
      ? ACTIVE_SWAP_MESSAGE
      : AWAITING_COORDINATION_MESSAGE;
  }

  if (!dateParam) {
    return <div>Data inválida.</div>;
  }

  const [yearStr, monthStr, dayStr] = dateParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const date = new Date(year, month, day);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(date.getTime())
  ) {
    return <div>Data inválida.</div>;
  }

  const formattedDate = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function loadHospitalFromStorage(userId: string) {
    if (typeof window === "undefined") return null;

    const hospitalFromUrl = searchParams.get("hospitalId");

    const scopedKey = `activeHospitalId:${userId}`;
    const scopedHospitalId = window.localStorage.getItem(scopedKey);

    // Prioridade:
    // 1. hospitalId vindo da URL
    // 2. hospital salvo por usuário
    // 3. fallback antigo, só para compatibilidade
    const storedHospitalId =
      hospitalFromUrl ||
      scopedHospitalId ||
      window.localStorage.getItem("activeHospitalId");

    if (!storedHospitalId) {
      router.push("/selecionar-hospital");
      return null;
    }

    // Confirma que o usuário pertence a esse hospital
    const { data: membership, error: membershipError } = await supabase
      .from("hospital_users")
      .select("hospital_id")
      .eq("user_id", userId)
      .eq("hospital_id", storedHospitalId)
      .maybeSingle();

    if (membershipError || !membership) {
      setErrorMsg("Você não tem vínculo com o hospital selecionado.");
      router.replace("/selecionar-hospital");
      return null;
    }

    const { data: hosp, error: hospError } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("id", storedHospitalId)
      .maybeSingle();

    if (hospError || !hosp) {
      setErrorMsg("Não foi possível identificar o hospital selecionado.");
      return null;
    }

    // Mantém o hospital ativo salvo no padrão correto
    window.localStorage.setItem(scopedKey, hosp.id);
    window.localStorage.setItem("activeHospitalId", hosp.id);

    setHospitalId(hosp.id);
    setHospitalName(hosp.name ?? "Hospital");

    return hosp.id as string;
  }

  async function loadDoctors(hospital_id: string) {
    const { data: rows, error } = await supabase
      .from("hospital_users")
      .select("user_id, users(full_name, email)")
      .eq("hospital_id", hospital_id)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMsg("Erro ao carregar médicos do hospital.");
      setDoctors([]);
      return;
    }

    const mapped: DoctorOption[] = (rows ?? []).map((row: any) => {
      const userObj = Array.isArray(row.users) ? row.users[0] : row.users;
      return {
        id: row.user_id,
        name: userObj?.full_name ?? userObj?.email ?? "Médico sem nome",
        email: userObj?.email ?? null,
      };
    });

    setDoctors(mapped);
  }

  function isAdministrativelyCancellable(request: ActiveSwapRequest) {
    if (request.target_user_id !== null) {
      return request.reason === "__direct_offer__";
    }

    return ![
      "__direct_offer__",
      "__direct_offer__accepted",
      "__offer_via_disponibilidade__",
    ].includes(request.reason ?? "");
  }

  async function fetchShiftSwapProtection(
    shiftIds: number[],
    hospital_id: string,
  ) {
    if (shiftIds.length === 0) {
      return {
        protectedIds: new Set<number>(),
        cancellableIdsByShiftId: new Map<number, number[]>(),
      };
    }

    const { data, error } = await supabase
      .from("shift_swap_requests")
      .select("id, from_shift_id, target_user_id, reason")
      .eq("hospital_id", hospital_id)
      .in("from_shift_id", shiftIds)
      .in("status", ["pendente", "pending"]);

    if (error) throw new Error(PROTECTION_CHECK_FAILED_MESSAGE);

    const requests = (data ?? []) as ActiveSwapRequest[];
    const cancellableIdsByShiftId = new Map<number, number[]>();

    for (const request of requests) {
      if (!isAdministrativelyCancellable(request)) continue;

      const requestIds = cancellableIdsByShiftId.get(request.from_shift_id) ?? [];
      requestIds.push(request.id);
      cancellableIdsByShiftId.set(request.from_shift_id, requestIds);
    }

    return {
      protectedIds: new Set(requests.map((request) => request.from_shift_id)),
      cancellableIdsByShiftId,
    };
  }

  async function loadShiftsForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from("shifts")
      .select("id, period, doctor_user_id, is_chief, badge")
      .eq("hospital_id", hospital_id)
      .eq("date", dateParam);

    if (error) {
      setErrorMsg("Erro ao carregar plantões do dia.");
      return;
    }

    const rows = (data ?? []) as ShiftRow[];

    try {
      const protection = await fetchShiftSwapProtection(
        rows.map((row) => row.id),
        hospital_id,
      );
      setProtectedShiftIds(protection.protectedIds);
      setCancellableRequestIdsByShiftId(
        protection.cancellableIdsByShiftId,
      );
    } catch {
      setProtectedShiftIds(new Set());
      setCancellableRequestIdsByShiftId(new Map());
      setErrorMsg(PROTECTION_CHECK_FAILED_MESSAGE);
    }

    const mapToState = (periodKey: string): ShiftSlot[] => {
      const filtered = rows.filter((r) => r.period === periodKey);
      if (filtered.length === 0) {
        return [{ shiftId: null, userId: "", isChief: false, badge: "" }];
      }

      return filtered.map((r) => ({
        shiftId: r.id,
        userId: r.doctor_user_id ?? "",
        isChief: r.is_chief ?? false,
        badge: r.badge ?? "",
      }));
    };

    setManhaDoctors(mapToState("manha"));
    setTardeDoctors(mapToState("tarde"));
    setNoiteDoctors(mapToState("noite"));
  }

  async function refreshShiftSwapProtection(shiftId: number) {
    if (!hospitalId) throw new Error(PROTECTION_CHECK_FAILED_MESSAGE);

    const protection = await fetchShiftSwapProtection([shiftId], hospitalId);

    setProtectedShiftIds((current) => {
      const next = new Set(current);
      next.delete(shiftId);
      if (protection.protectedIds.has(shiftId)) next.add(shiftId);
      return next;
    });

    setCancellableRequestIdsByShiftId((current) => {
      const next = new Map(current);
      next.delete(shiftId);
      const requestIds = protection.cancellableIdsByShiftId.get(shiftId);
      if (requestIds?.length) next.set(shiftId, requestIds);
      return next;
    });

    return protection;
  }

  async function handleAdministrativeCancellation(
    slot: ShiftSlot,
    period: PeriodKey,
  ) {
    if (!hospitalId || slot.shiftId === null) return;

    const requestId = cancellableRequestIdsByShiftId.get(slot.shiftId)?.[0];
    if (!requestId) return;

    const doctorName =
      doctors.find((doctor) => doctor.id === slot.userId)?.name ??
      "Médico não identificado";
    const periodLabel = PERIODS.find((item) => item.key === period)?.label ?? period;
    const typedValue = window.prompt(
      `Cancelar somente o anúncio deste plantão?\n\nHospital: ${hospitalName}\nData: ${formattedDate}\nPeríodo: ${periodLabel}\nMédico atual: ${doctorName}\n\nEsta ação cancela somente o anúncio e não remove o plantão da escala. O cancelamento ficará registrado, e os usuários envolvidos serão notificados pelo sistema.\n\nPara confirmar, digite: ${ADMIN_CANCEL_CONFIRMATION}`,
    );

    if (typedValue === null) return;

    if (typedValue.trim().toUpperCase() !== ADMIN_CANCEL_CONFIRMATION) {
      setErrorMsg(
        "Frase de confirmação incorreta. O anúncio não foi cancelado.",
      );
      return;
    }

    setCancellingShiftId(slot.shiftId);
    setErrorMsg(null);

    try {
      const { error } = await supabase.rpc(
        "cancel_shift_swap_as_hospital_admin",
        {
          p_request_id: requestId,
          p_shift_id: slot.shiftId,
          p_hospital_id: hospitalId,
        },
      );

      if (error) {
        const message = error.message ?? "";
        try {
          await refreshShiftSwapProtection(slot.shiftId);
        } catch {
          setErrorMsg(PROTECTION_CHECK_FAILED_MESSAGE);
          return;
        }

        setErrorMsg(
          message.includes("admin_required")
            ? "Você não possui permissão para cancelar este anúncio."
            : message.includes("request_not_cancelable")
              ? "Este anúncio mudou de situação e não pode mais ser cancelado por aqui. Verifique as solicitações pendentes."
              : "Não foi possível cancelar o anúncio com segurança. Atualize a página e tente novamente.",
        );
        return;
      }

      const protection = await refreshShiftSwapProtection(slot.shiftId);
      if (protection.protectedIds.has(slot.shiftId)) {
        setErrorMsg(
          "O anúncio foi cancelado, mas existe outra solicitação ativa para este plantão.",
        );
        return;
      }

      window.alert("Anúncio cancelado. O plantão está liberado para alteração.");
    } catch {
      setErrorMsg(
        "Não foi possível cancelar o anúncio com segurança. Atualize a página e tente novamente.",
      );
    } finally {
      setCancellingShiftId(null);
    }
  }

  async function loadAvailabilityForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from("availability")
      .select("user_id, period")
      .eq("hospital_id", hospital_id)
      .eq("date", dateParam);

    if (!error && data) {
      setAvailability(data as AvailabilityRow[]);
    } else {
      setAvailability([]);
    }
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const hospital_id = await loadHospitalFromStorage(user.id);
      if (!hospital_id) return;

      // 🔒 BLOQUEIO: só admin pode editar escala
      const { data: membership, error: memErr } = await supabase
        .from("hospital_users")
        .select("role, is_admin")
        .eq("user_id", user.id)
        .eq("hospital_id", hospital_id)
        .maybeSingle();

      if (memErr) {
        console.error("Erro ao checar role:", memErr);
        router.replace(`/escala?date=${dateParam}&hospitalId=${hospital_id}`);
        return;
      }

      const isAllowed =
        membership?.is_admin === true || membership?.role === "admin";

      if (!isAllowed) {
        if (membership?.role === "coordenador") {
          router.replace("/coordenador/escala");
        } else {
          router.replace(`/escala?date=${dateParam}&hospitalId=${hospital_id}`);
        }

        return;
      }

      // 🔓 Só chega aqui se for admin
      await loadDoctors(hospital_id);
      await loadShiftsForDay(hospital_id);
      await loadAvailabilityForDay(hospital_id);
    }

    init();
  }, [dateParam, router]);

  function handleDoctorChange(
    period: PeriodKey,
    index: number,
    newUserId: string,
  ) {
    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const slot = arr[index];
      if (
        slot.shiftId !== null &&
        protectedShiftIds.has(slot.shiftId)
      ) {
        setErrorMsg(protectedShiftMessage(slot.shiftId));
        return;
      }

      const copy = [...arr];
      copy[index] = { ...copy[index], userId: newUserId };
      setArr(copy);
    };

    switch (period) {
      case "manha":
        update(manhaDoctors, setManhaDoctors);
        break;
      case "tarde":
        update(tardeDoctors, setTardeDoctors);
        break;
      case "noite":
        update(noiteDoctors, setNoiteDoctors);
        break;
    }
  }

  function handleToggleChief(
    period: PeriodKey,
    index: number,
    isChecked: boolean,
  ) {
    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy[index] = { ...copy[index], isChief: isChecked };
      setArr(copy);
    };

    switch (period) {
      case "manha":
        update(manhaDoctors, setManhaDoctors);
        break;
      case "tarde":
        update(tardeDoctors, setTardeDoctors);
        break;
      case "noite":
        update(noiteDoctors, setNoiteDoctors);
        break;
    }
  }

  function handleBadgeChange(period: PeriodKey, index: number, text: string) {
    const cleanText = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);

    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy[index] = { ...copy[index], badge: cleanText };
      setArr(copy);
    };

    switch (period) {
      case "manha":
        update(manhaDoctors, setManhaDoctors);
        break;
      case "tarde":
        update(tardeDoctors, setTardeDoctors);
        break;
      case "noite":
        update(noiteDoctors, setNoiteDoctors);
        break;
    }
  }

  function badgeKey(period: PeriodKey, index: number) {
    return `${period}-${index}`;
  }

  function openBadge(period: PeriodKey, index: number) {
    const k = badgeKey(period, index);
    setBadgeOpen((prev) => ({ ...prev, [k]: true }));
  }

  function closeBadgeIfEmpty(
    period: PeriodKey,
    index: number,
    currentBadge: string,
  ) {
    const k = badgeKey(period, index);
    if ((currentBadge ?? "").trim().length === 0) {
      setBadgeOpen((prev) => ({ ...prev, [k]: false }));
    }
  }

  function handleAddDoctor(period: PeriodKey) {
    const addTo = (
      arr: ShiftSlot[],
      setArr: (v: ShiftSlot[]) => void,
      max: number,
    ) => {
      if (arr.length >= max) return;
      setArr([
        ...arr,
        { shiftId: null, userId: "", isChief: false, badge: "" },
      ]);
    };

    const config = PERIODS.find((p) => p.key === period);
    if (!config) return;

    switch (period) {
      case "manha":
        addTo(manhaDoctors, setManhaDoctors, config.maxDoctors);
        break;
      case "tarde":
        addTo(tardeDoctors, setTardeDoctors, config.maxDoctors);
        break;
      case "noite":
        addTo(noiteDoctors, setNoiteDoctors, config.maxDoctors);
        break;
    }
  }

  function handleRemoveDoctor(period: PeriodKey, index: number) {
    const removeFrom = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const slot = arr[index];
      if (
        slot.shiftId !== null &&
        protectedShiftIds.has(slot.shiftId)
      ) {
        setErrorMsg(protectedShiftMessage(slot.shiftId));
        return;
      }

      const copy = [...arr];
      copy.splice(index, 1);
      if (copy.length === 0) {
        copy.push({ shiftId: null, userId: "", isChief: false, badge: "" });
      }
      setArr(copy);
    };

    switch (period) {
      case "manha":
        removeFrom(manhaDoctors, setManhaDoctors);
        break;
      case "tarde":
        removeFrom(tardeDoctors, setTardeDoctors);
        break;
      case "noite":
        removeFrom(noiteDoctors, setNoiteDoctors);
        break;
    }
  }

  function handleClearAll() {
    if (!hospitalId) return;
    if (protectedShiftIds.size > 0) {
      setErrorMsg(
        [...protectedShiftIds].some(
          (shiftId) => !cancellableRequestIdsByShiftId.has(shiftId),
        )
          ? AWAITING_COORDINATION_MESSAGE
          : ACTIVE_SWAP_MESSAGE,
      );
      return;
    }

    setManhaDoctors([{ shiftId: null, userId: "", isChief: false, badge: "" }]);
    setTardeDoctors([{ shiftId: null, userId: "", isChief: false, badge: "" }]);
    setNoiteDoctors([{ shiftId: null, userId: "", isChief: false, badge: "" }]);
  }

  // --- NOVAS FUNÇÕES DE SYNC E COPY ---

  function toDbBadge(badge: string): string | null {
    const v = (badge ?? "").trim();
    return v.length > 0 ? v.slice(0, 4).toUpperCase() : null;
  }

  function buildDesiredRows(dateStr: string) {
    if (!hospitalId) return [];

    const desired: Array<{
      shiftId: number | null;
      hospital_id: string;
      date: string;
      period: PeriodKey;
      doctor_user_id: string;
      is_chief: boolean;
      badge: string | null;
    }> = [];

    const push = (arr: ShiftSlot[], period: PeriodKey) => {
      for (const slot of arr) {
        const uid = (slot.userId ?? "").trim();
        if (!uid) continue;

        desired.push({
          shiftId: slot.shiftId ?? null,
          hospital_id: hospitalId,
          date: dateStr,
          period,
          doctor_user_id: uid,
          is_chief: !!slot.isChief,
          badge: toDbBadge(slot.badge),
        });
      }
    };

    push(manhaDoctors, "manha");
    push(tardeDoctors, "tarde");
    push(noiteDoctors, "noite");

    return desired;
  }

  async function syncShiftsForDay(dateStr: string) {
    if (!hospitalId) return;

    // 1) Carrega o que existe no banco (dia/hospital)
    const { data: existing, error: loadErr } = await supabase
      .from("shifts")
      .select("id, period, doctor_user_id, is_chief, badge")
      .eq("hospital_id", hospitalId)
      .eq("date", dateStr);

    if (loadErr) throw loadErr;

    const existingRows = (existing ?? []) as ShiftRow[];

    // 2) Monta o “desejado” a partir do estado
    const desired = buildDesiredRows(dateStr);

    const desiredById = new Map(
      desired
        .filter((row) => row.shiftId !== null)
        .map((row) => [row.shiftId as number, row]),
    );
    const structurallyChangedIds = existingRows
      .filter((row) => {
        if (!isAllowedPeriod(row.period)) return false;

        const desiredRow = desiredById.get(row.id);
        return (
          !desiredRow ||
          desiredRow.doctor_user_id !== row.doctor_user_id ||
          desiredRow.period !== row.period
        );
      })
      .map((row) => row.id);

    const latestProtection = await fetchShiftSwapProtection(
      structurallyChangedIds,
      hospitalId,
    );

    if (latestProtection.protectedIds.size > 0) {
      setProtectedShiftIds((current) =>
        new Set([...current, ...latestProtection.protectedIds]),
      );
      throw new Error(
        [...latestProtection.protectedIds].some(
          (shiftId) =>
            !latestProtection.cancellableIdsByShiftId.has(shiftId),
        )
          ? AWAITING_COORDINATION_MESSAGE
          : ACTIVE_SWAP_MESSAGE,
      );
    }

    // 3) Atualiza o que tem shiftId e insere o que não tem
    const desiredIds = new Set(desiredById.keys());

    for (const row of desired) {
      if (!isAllowedPeriod(row.period)) {
        console.warn("Período bloqueado no front:", row.period);
        continue;
      }

      if (row.shiftId) {
        const { error: updErr } = await supabase
          .from("shifts")
          .update({
            period: row.period,
            doctor_user_id: row.doctor_user_id,
            is_chief: row.is_chief,
            badge: row.badge,
          })
          .eq("id", row.shiftId)
          .eq("hospital_id", hospitalId);

        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from("shifts").insert([
          {
            hospital_id: row.hospital_id,
            date: row.date,
            period: row.period,
            doctor_user_id: row.doctor_user_id,
            is_chief: row.is_chief,
            badge: row.badge,
          },
        ]);

        if (insErr) throw insErr;
      }
    }

    // 4) Deleta o que existe no banco mas não está mais no estado (remoções reais)
    const toDeleteIds: number[] = [];
    for (const r of existingRows) {
      if (!isAllowedPeriod(r.period)) continue;

      if (!desiredIds.has(r.id)) {
        toDeleteIds.push(r.id);
      }
    }

    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from("shifts")
        .delete()
        .eq("hospital_id", hospitalId)
        .in("id", toDeleteIds);

      if (delErr) throw delErr;
    }
  }

  async function copyShiftsToDate(targetDate: string) {
    if (!hospitalId) return;

    // 1) Carrega o que existe no destino
    const { data: existing, error: loadErr } = await supabase
      .from("shifts")
      .select("id, period, doctor_user_id, is_chief, badge")
      .eq("hospital_id", hospitalId)
      .eq("date", targetDate);

    if (loadErr) throw loadErr;

    const existingRows = ((existing ?? []) as ShiftRow[]).filter((r) =>
      isAllowedPeriod(r.period),
    );

    // 2) “Desired” baseado no estado atual, mas SEM shiftId
    const desired = buildDesiredRows(targetDate).map((r) => ({
      ...r,
      shiftId: null,
    }));

    // 3) Estratégia simples e segura pro copy:
    // - Atualiza/insere baseado em (period + doctor_user_id) como “chave lógica”
    // - Remove do destino o que não existe mais no desired
    const key = (r: { period: string; doctor_user_id: string }) =>
      `${r.period}::${r.doctor_user_id}`;

    const existingByKey = new Map<string, ShiftRow>();
    for (const r of existingRows) {
      existingByKey.set(
        key({ period: r.period, doctor_user_id: r.doctor_user_id ?? "" }),
        r,
      );
    }

    const desiredKeys = new Set<string>();

    for (const r of desired) {
      const k = key({ period: r.period, doctor_user_id: r.doctor_user_id });
      desiredKeys.add(k);

      const match = existingByKey.get(k);

      if (match) {
        const { error: updErr } = await supabase
          .from("shifts")
          .update({
            is_chief: r.is_chief,
            badge: r.badge,
          })
          .eq("id", match.id)
          .eq("hospital_id", hospitalId);

        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from("shifts").insert([
          {
            hospital_id: hospitalId,
            date: targetDate,
            period: r.period,
            doctor_user_id: r.doctor_user_id,
            is_chief: r.is_chief,
            badge: r.badge,
          },
        ]);

        if (insErr) throw insErr;
      }
    }

    // remover do destino o que não está mais no desired
    const toDeleteIds: number[] = [];
    for (const r of existingRows) {
      const k = key({
        period: r.period,
        doctor_user_id: r.doctor_user_id ?? "",
      });
      if (!desiredKeys.has(k)) toDeleteIds.push(r.id);
    }

    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from("shifts")
        .delete()
        .eq("hospital_id", hospitalId)
        .in("id", toDeleteIds);

      if (delErr) throw delErr;
    }
  }

  async function handleSave() {
    if (!hospitalId) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      await syncShiftsForDay(dateParam!);

      // recarrega como você já fazia (bom porque re-hidrata shiftId e estado)
      router.replace(`/escala?date=${dateParam}&hospitalId=${hospitalId}`);
    } catch (err: any) {
      const message = err?.message ?? "desconhecido";
      setErrorMsg(
        message === ACTIVE_SWAP_MESSAGE ||
          message === AWAITING_COORDINATION_MESSAGE ||
          message === PROTECTION_CHECK_FAILED_MESSAGE
          ? message
          : `Erro ao salvar: ${message}`,
      );
      setSaving(false);
    }
  }

  async function handleCopyToDate() {
    if (!hospitalId) return;
    if (!copyTargetDate) {
      setErrorMsg("Informe a data de destino para copiar a escala.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // Estratégia: copiar o “desejado” do dia atual para o destino
      await copyShiftsToDate(copyTargetDate);

      setSaving(false);
      alert("Copiado com sucesso!");
    } catch (err: any) {
      setErrorMsg(`Erro ao copiar: ${err?.message ?? "desconhecido"}`);
      setSaving(false);
    }
  }

  function getAvailabilityStatus(userId: string, period: PeriodKey) {
    if (!userId) return null;

    const exists = availability.some(
      (a) => a.user_id === userId && a.period === period,
    );

    if (!exists) {
      return {
        label: "Sem anúncio",
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
    }

    return {
      label: "Disponível",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  const periodStateMap: Record<PeriodKey, { values: ShiftSlot[] }> = {
    manha: { values: manhaDoctors },
    tarde: { values: tardeDoctors },
    noite: { values: noiteDoctors },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="rounded-b-[28px] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-start px-6 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <img
              src="/medturn-logo-transparent.png"
              alt="MedTurn"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div className="ml-5 flex flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#40C0A2]">
                MedTurn • Escala
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Editar plantões do dia
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {hospitalName} • {formattedDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() =>
                  router.push(
                    hospitalId
                      ? `/escala?date=${dateParam}&hospitalId=${hospitalId}`
                      : `/escala?date=${dateParam}`,
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar para escala
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6 space-y-5">
        {errorMsg && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
            Organização do plantão
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            Médicos escalados por período
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Marque <strong>CH</strong> para indicar o chefe de plantão. Use o
            ícone de etiqueta para adicionar um badge curto quando necessário.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {PERIODS.map((p) => {
            const state = periodStateMap[p.key];

            return (
              <section
                key={p.key}
                className={`flex flex-col rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm ${
                  p.key === "noite"
                    ? "lg:col-start-1 lg:col-end-3 lg:mx-auto lg:w-[70%]"
                    : ""
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Período
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                      {p.label}
                    </h2>
                  </div>

                  <span className="rounded-2xl bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Máx. {p.maxDoctors}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {state.values.map((slot, index) => {
                    const isProtected =
                      slot.shiftId !== null &&
                      protectedShiftIds.has(slot.shiftId);
                    const canCancelAnnouncement =
                      slot.shiftId !== null &&
                      (cancellableRequestIdsByShiftId.get(slot.shiftId)
                        ?.length ?? 0) > 0;
                    const protectionMessage =
                      slot.shiftId !== null
                        ? protectedShiftMessage(slot.shiftId)
                        : ACTIVE_SWAP_MESSAGE;
                    const status = isProtected
                      ? {
                          label: canCancelAnnouncement
                            ? "Plantão anunciado"
                            : "Aguardando coordenação",
                          className: canCancelAnnouncement
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-100",
                        }
                      : getAvailabilityStatus(slot.userId, p.key);

                    return (
                      <div
                        key={`${p.key}-${index}`}
                        className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <select
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#40C0A2] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            value={slot.userId}
                            disabled={isProtected}
                            title={isProtected ? protectionMessage : undefined}
                            onChange={(e) =>
                              handleDoctorChange(p.key, index, e.target.value)
                            }
                          >
                            <option value="">Selecione um médico...</option>
                            {sortedDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                          {canCancelAnnouncement && slot.shiftId !== null && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAdministrativeCancellation(slot, p.key)
                              }
                              disabled={cancellingShiftId === slot.shiftId}
                              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black uppercase text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Cancelar administrativamente este anúncio"
                            >
                              {cancellingShiftId === slot.shiftId
                                ? "Cancelando..."
                                : "Cancelar anúncio"}
                            </button>
                          )}

                          {badgeOpen[badgeKey(p.key, index)] ? (
                            <label
                              title="Badge (até 4)"
                              className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-800 px-2 py-2 text-white transition"
                            >
                              <input
                                type="text"
                                inputMode="text"
                                maxLength={4}
                                value={slot.badge}
                                onChange={(e) =>
                                  handleBadgeChange(
                                    p.key,
                                    index,
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  closeBadgeIfEmpty(p.key, index, slot.badge)
                                }
                                autoFocus
                                className="w-10 bg-transparent text-center text-[9px] font-black uppercase tracking-wide outline-none"
                              />
                            </label>
                          ) : slot.badge?.trim() ? (
                            <button
                              type="button"
                              title="Editar badge"
                              onClick={() => openBadge(p.key, index)}
                              className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-black uppercase text-blue-700"
                            >
                              {slot.badge}
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Adicionar badge"
                              onClick={() => openBadge(p.key, index)}
                              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-400"
                            >
                              <span className="text-[11px] font-black">🏷️</span>
                            </button>
                          )}

                          <label
                            title="Chefe de Plantão"
                            className={`flex cursor-pointer select-none items-center gap-1 rounded-2xl border px-3 py-2 transition ${
                              slot.isChief
                                ? "border-slate-800 bg-slate-800 text-white"
                                : "border-slate-200 bg-white text-slate-400 hover:border-slate-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={slot.isChief}
                              onChange={(e) =>
                                handleToggleChief(
                                  p.key,
                                  index,
                                  e.target.checked,
                                )
                              }
                            />

                            <span className="text-[9px] font-black">CH</span>
                          </label>

                          {status ? (
                            <span
                              className={`whitespace-nowrap rounded-2xl border px-2.5 py-2 text-[9px] font-bold ${status.className}`}
                              title={
                                isProtected ? protectionMessage : status.label
                              }
                            >
                              {isProtected
                                ? status.label
                                : status.label === "Disponível"
                                  ? "Disp."
                                  : status.label}
                            </span>
                          ) : (
                            <span className="select-none px-1 text-[9px] text-slate-300">
                              —
                            </span>
                          )}

                          {(state.values.length > 1 || slot.userId !== "") && (
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => handleRemoveDoctor(p.key, index)}
                              disabled={isProtected}
                              title={
                                isProtected
                                  ? protectionMessage
                                  : "Remover vaga / Limpar"
                              }
                            >
                              <span className="text-sm font-black">×</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddDoctor(p.key)}
                  className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 bg-white py-3 text-xs font-black uppercase tracking-wider text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  + Adicionar vaga
                </button>
              </section>
            );
          })}
        </div>

        <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={saving}
              title={
                protectedShiftIds.size > 0
                  ? [...protectedShiftIds].some(
                      (shiftId) =>
                        !cancellableRequestIdsByShiftId.has(shiftId),
                    )
                    ? AWAITING_COORDINATION_MESSAGE
                    : ACTIVE_SWAP_MESSAGE
                  : "Limpar todos os plantões do dia"
              }
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              Limpar dia
            </button>

            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Copiar para:
                </span>

                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="border-none bg-transparent p-0 text-xs font-semibold text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={handleCopyToDate}
                  disabled={saving}
                  className="border-l border-slate-200 pl-3 text-[10px] font-black uppercase text-[#1E7564] hover:text-[#102322] disabled:opacity-50"
                >
                  Copiar
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 active:scale-95 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditarPlantaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Carregando...
            </p>
          </div>
        </div>
      }
    >
      <EditarPlantaoContent />
    </Suspense>
  );
}
