# Basis resmi Apify: Node 20 + Chromium Playwright sudah terpasang
FROM apify/actor-node-playwright-chrome:20

# Pasang dependensi (hanya manifest dulu agar cache Docker efektif)
COPY package*.json ./
RUN npm --quiet set progress=false \
 && npm install --omit=dev --no-optional --no-audit --no-fund \
 && echo "Dependensi terpasang."

# Salin kode
COPY . ./

# Apify menjalankan perintah start dari package.json
CMD npm start --silent
