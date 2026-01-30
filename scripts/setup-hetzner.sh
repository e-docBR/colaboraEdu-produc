#!/bin/bash

# ColaboraFREI - Hetzner Auto-Setup Script
# Este script automatiza a instalação do Docker, Nginx, Certbot e a configuração do sistema ColaboraFREI.

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando Setup ColaboraFREI na Hetzner ===${NC}"

# 1. Atualização do Sistema e Instalação de Dependências
echo -e "${GREEN}[1/6] Atualizando sistema e instalando dependências...${NC}"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

# Garantir que o Docker inicie com o sistema
sudo systemctl enable --now docker

# 2. Configurações de Variáveis de Ambiente
echo -e "${GREEN}[2/6] Configurando variáveis de ambiente...${NC}"
read -p "Digite o domínio (ex: sistema.escola.com.br): " DOMAIN
read -s -p "Digite uma senha forte para o Banco de Dados: " DB_PASSWORD
echo ""
read -s -p "Digite uma SECRET_KEY (aperte enter para gerar uma aleatória): " USER_SECRET

if [ -z "$USER_SECRET" ]; then
    USER_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

# Criar .env na raiz do projeto (ajuste se necessário)
cat <<EOF > .env
POSTGRES_PASSWORD=$DB_PASSWORD
ALLOWED_ORIGINS=["https://$DOMAIN"]
SECRET_KEY=$USER_SECRET
FLASK_DEBUG=0
EOF

echo "Arquivo .env criado com sucesso."

# 3. Configuração do Docker Compose de Produção
echo -e "${GREEN}[3/6] Iniciando containers via Docker Compose...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Inicialização do Banco de Dados
echo -e "${GREEN}[4/6] Inicializando banco de dados...${NC}"
# Aguarda o Postgres estar pronto
echo "Aguardando 10 segundos para o Postgres estabilizar..."
sleep 10
docker-compose -f docker-compose.prod.yml exec -T backend flask --app app init-db

# 5. Configuração do Nginx Host como Proxy Reverso
echo -e "${GREEN}[5/6] Configurando Nginx como Proxy Reverso...${NC}"
NGINX_CONF="/etc/nginx/sites-available/colaborafrei"

sudo cat <<EOF > $NGINX_CONF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Websockets support (se necessário para chat em tempo real futuramente)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 6. Configuração do SSL com Certbot
echo -e "${GREEN}[6/6] Solicitando certificado SSL (HTTPS)...${NC}"
echo "Certifique-se que o DNS para $DOMAIN já está apontando para o IP deste servidor."
read -p "Deseja configurar o SSL agora? (s/n): " CONFIRM_SSL

if [[ "$CONFIRM_SSL" =~ ^[Ss]$ ]]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m suporte@$DOMAIN
fi

echo -e "${BLUE}=== Setup Concluído com Sucesso! ===${NC}"
echo -e "Acesse o sistema em: ${GREEN}https://$DOMAIN${NC}"
echo -e "Logs do sistema: ${BLUE}docker-compose -f docker-compose.prod.yml logs -f${NC}"
