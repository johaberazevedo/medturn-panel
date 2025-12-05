#!/bin/bash

FILE="app/escala/page.tsx"

# Substitui apenas o bloco PERIOD_CONFIG.map antigo pelo bloco com key
sed -i '' \
"s/PERIOD_CONFIG.map((p) => periodCountBadge(p.key, counts\[p.key\]))/PERIOD_CONFIG.map((p) => { const badge = periodCountBadge(p.key, counts[p.key]); if (!badge) return null; return React.cloneElement(badge, { key: p.key }); })/" \
"$FILE"

echo "✔ Patch aplicado no arquivo app/escala/page.tsx"
