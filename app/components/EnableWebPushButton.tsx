'use client';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
  }
}

export default function EnableWebPushButton() {
  async function handleEnable() {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      const permission = window.Notification?.permission;

      if (permission === 'granted') {
        alert('As notificações já estão ativas neste dispositivo.');
        return;
      }

      await OneSignal.Notifications.requestPermission();
    });
  }

  return (
    <button
      type="button"
      onClick={handleEnable}
      className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl">
          🔔
        </div>
        <div className="text-left">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            Ativar Notificações
          </h2>
          <p className="text-xs text-slate-500">
            Receba avisos do MedTurn neste Android
          </p>
        </div>
      </div>
    </button>
  );
}