FROM node:15

WORKDIR /home/node/app

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y build-essential libcairo2-dev \
	libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ADD --chown=node:node package*json .

RUN npm install --only=production

ADD --chown=node:node . .

ENV NODE_ENV=production
VOLUME ["/home/node/app/static"]

WORKDIR /workdir

ENTRYPOINT ["node", "/home/node/app/index.js"]
CMD ["node", "/home/node/app/index.js"]