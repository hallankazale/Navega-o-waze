
# Navegador estilo Waze — Demo

Este pacote tem 3 variações:

- `index.html` → versão completa (Home → Pré-rota → Navegação com velocímetro/ETA).
- `alt/index_fix_visibility.html` → correção de visibilidade (garante que a folha de busca nunca fique atrás do mapa).
- `alt/index_home_search_fix.html` → home com busca sempre visível + botão 🔎.

## Como publicar no GitHub Pages
1. Crie um repositório (p.ex. `Navegador-Waze`).
2. Faça upload do **index.html** (e da pasta `alt/` se quiser manter as alternativas).
3. Em *Settings → Pages*, selecione a branch (geralmente `main`) e a pasta `/root`.
4. Abra `https://SEU_USUARIO.github.io/NomeDoRepo/` no celular.

## Dicas
- Permita **Localização** no navegador para origem automática.
- O autocomplete usa **Nominatim (OpenStreetMap)**; se a rede bloquear, as sugestões podem não aparecer.
- O roteamento usa **OSRM público**. Funções de "evitar pedágio" aqui são mock visuais.
