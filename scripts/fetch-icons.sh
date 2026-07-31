#!/usr/bin/env bash
# Descarga iconos de Simple Icons y los normaliza a currentColor.
# Uso: bash scripts/fetch-icons.sh
set -u

OUT="public/img/svgs"
VER="13"
mkdir -p "$OUT"

# local_name simpleicons_slug
ICONS="
react react
next nextdotjs
astro astro
angular angular
vue vuedotjs
ts typescript
js javascript
tailwindcss tailwindcss
sass sass
gsap greensock
threejs threedotjs
node nodedotjs
nestjs nestjs
spring springboot
laravel laravel
express express
php php
postgres postgresql
oracle oracle
mysql mysql
mongo mongodb
docker docker
kubernetes kubernetes
git git
github github
gitlab gitlab
bitbucket bitbucket
figma figma
mcp modelcontextprotocol
turso turso
clerk clerk
html html5
css css3
"

FAILED=""

echo "$ICONS" | while read -r name slug; do
  [ -z "$name" ] && continue
  url="https://cdn.jsdelivr.net/npm/simple-icons@${VER}/icons/${slug}.svg"
  if curl -fsSL "$url" -o "$OUT/${name}.svg"; then
    # Simple Icons entrega paths sin fill; forzar currentColor explicito
    # y quitar cualquier fill de color fijo.
    sed -i 's/<svg /<svg fill="currentColor" /; s/fill="#[0-9A-Fa-f]\{3,6\}"//g' "$OUT/${name}.svg"
    echo "ok    ${name} <- ${slug}"
  else
    echo "FALLO ${name} <- ${slug}"
    FAILED="${FAILED} ${name}"
  fi
done

echo "---"
echo "Revisar manualmente los marcados FALLO; requieren glifo propio."
