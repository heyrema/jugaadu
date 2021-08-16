# Jugaadu Rema
A hacked, rewritten fork of Rema, a powerful and scalable
certificate generation and management system for individuals,
businesses, clubs, and organizations.

<br/>

<p align='center'>
	<a href='#'><img src='docs/logo.svg' alt='Rema Logo' width='80%' /></a>
</p>

> Jugaadu (Hindi: `जुगाड़ू`, IPA: `/dʒʊɡɑːduː/`) is an Indian
> adjective that refers to something that uses a flexible
> approach to solve a problem using limited resources in
> an innovative way.

This fork of Rema aims to provide solutions to those lacking
resources and/or funds by maintaining a static stripped-down
less-cost version of Rema, provided sufficient manual
feeding and organization of data.

## Instructions
See the [wiki](../../wiki) for instructions on setup and development.

For other discussions, see the [discussions](../../discussions) page.

## Execution (Docker)
Build the Docker image using Docker Compose.
```bash
docker compose build
```

Start using Jugaadu Rema's CLI anywhere using Docker bind mounts for working and accessible directories.
```bash
docker run --rm -it \
		-v rema-static:/home/node/app/static \
		-v $(pwd):/workdir \
		jrema \
		--help
```

## Execution
Install the dependencies for `node-canvas` in your operating system as
specified [here](../../wiki/Development-Setup).

```bash
# Ubuntu
sudo apt install build-essential libcairo2-dev \
	libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

Install the dependencies for Rema locally.

```bash
cd src
npm i -g .
```

Start using the Jugaadu Rema CLI!
```bash
jrema --help
```

For more information, see the [wiki](../../wiki).

# Made with ❤ by [Param](https://www.paramsid.com).