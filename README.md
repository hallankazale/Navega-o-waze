# App de Navegação (estilo Waze)

Aplicativo web de navegação com três telas: **Home → Pré-rota → Navegação em tempo real**, com:
- Autocomplete por endereço (Nominatim/OSM)
- Botão **Minha localização**
- Cálculo de rota (OSRM)
- Navegação com HUD e “carro” animado
- Fallback de CDN (Leaflet / Leaflet Routing Machine)

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `navegacao-waze`).
2. Envie estes arquivos para a raiz do repositório:
   - `index.html` (este arquivo)
3. Vá em **Settings → Pages → Build and deployment**:
   - **Source**: *Deploy from a branch*
   - **Branch**: `main` / **Folder**: `/root` → **Save**
4. Acesse a URL gerada pelo GitHub Pages (HTTPS).

> Importante: **permita a localização** no navegador do celular.

## Teste local rápido (sem servidor)
Abra `index.html` no **Chrome**. Recursos de geolocalização funcionam melhor via HTTPS.

---

Feito com **Leaflet** + **Leaflet Routing Machine** + **OpenStreetMap**.
