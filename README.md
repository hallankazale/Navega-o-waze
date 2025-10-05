
# Waze Lite (GitHub Pages)

Site de navegação estilo Waze usando **Leaflet + Leaflet Routing Machine** e **Nominatim** para endereços.

## Estrutura
- `index.html` — página principal
- `assets/css/style.css` — estilos
- `assets/js/app.js` — lógica da aplicação

## Funcionalidades
- Home com busca, **📍 Minha localização**, atalhos e **recentes**
- **Autocomplete** de endereço (Nominatim)
- Pré-rota com tempo/distância e botão **Ir agora**
- Navegação em tempo real (usa GPS do celular)
- **Voz** das instruções (speechSynthesis)
- Velocímetro, **ETA**, distância restante
- Botões: **Recentrar**, **Demo** (simulação), **Stop**
- Camadas com `z-index` — os painéis SEMPRE ficam por cima do mapa

## Como publicar no GitHub Pages
1. Crie um repositório e suba estes arquivos.
2. Em **Settings → Pages**, aponte para a branch (ex.: `main`) e `/root`.
3. Abra a URL HTTPS do Pages no celular e permita a **Localização**.

> OSRM público é compartilhado e pode ficar lento/fora — é normal. Se quiser estabilidade, hospede um servidor OSRM próprio ou troque pelo GraphHopper/Mapbox Directions.
