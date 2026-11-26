# Ânima Eros: a camada da Ânima sobre a imagem base da Hermes.
# A base vem do Dockerfile da raiz do repositório (design system, marca e Webapp) e é gerada
# pelo `make build`, que depois constrói esta camada por cima.
ARG BASE_IMAGE=anima-eros-base:latest
FROM ${BASE_IMAGE}

# Área de trabalho remota (VNC + XFCE) para as ferramentas de navegador e de tela: a mesma
# camada que a stack anima-hermes acrescentava à imagem da Nous.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tigervnc-standalone-server xfce4-panel xfwm4 xfdesktop4 xfce4-settings \
      xfce4-terminal dbus-x11 x11-xserver-utils x11-utils x11-xkb-utils \
      xauth fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*
