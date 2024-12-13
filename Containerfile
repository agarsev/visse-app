ARG BASE_IMAGE

FROM $BASE_IMAGE AS base

RUN cd /etc/apt && rm -f sources.list && \
    echo "deb [trusted=yes] http://archive.debian.org/debian/ stretch main" >> sources.list && \
    echo "deb [trusted=yes] http://archive.debian.org/debian/ stretch-backports main" >> sources.list && \
    echo "deb [trusted=yes] http://archive.debian.org/debian-security/ stretch/updates main" >> sources.list && \
    echo "deb-src [trusted=yes] http://archive.debian.org/debian-security/ stretch/updates main" >> sources.list && \
    apt-get update -qqq

RUN apt-get install -yqq --no-install-recommends \
    libopencv-dev libjpeg62-turbo-dev wget \
    1>/dev/null


# BUILD DARKNET

FROM base AS build_darknet

ARG DEVICE

RUN apt-get install -yqq --no-install-recommends \
    git build-essential pkg-config \
    1>/dev/null

ENV GIT_SSL_NO_VERIFY=true
RUN git clone https://github.com/AlexeyAB/darknet /darknet && \
    cd /darknet && \
    git reset --hard aa002ea1f8fbce6e139210ee1d936ce58ce120e1 

COPY assets/darknet.$DEVICE.patch /darknet/darknet.patch

RUN cd /darknet && \
    git apply darknet.patch && \
    make -sj


# FINAL IMAGE

FROM base

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN wget --no-check-certificate -qO- https://github.com/agarsev/visse/releases/download/v1.0.0/visse-corpus-1.0.0.tgz | tar xz

COPY --from=build_darknet /darknet/darknet /darknet/libdarknet.so /corpus/darknet/

WORKDIR /backend

#    uv:
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:0.5.8 /uv /uvx /bin/

#    uv: python deps
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

#    uv: project itself
ADD --exclude=.venv . /backend
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

WORKDIR /

ENV CORPUS_PATH=/corpus
ENV PATH="/backend/.venv/bin:$PATH"
ENV HOST="0.0.0.0"
ENV PORT="8000"

ENTRYPOINT []

CMD ["visse-backend"]
