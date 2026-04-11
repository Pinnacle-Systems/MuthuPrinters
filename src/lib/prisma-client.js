import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  Prisma as GeneratedPrisma,
  PrismaClient as GeneratedPrismaClient,
} from "@prisma/client";

function getRequiredDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  return process.env.DATABASE_URL;
}

function createAdapter() {
  const connectionUrl = new URL(getRequiredDatabaseUrl());
  const database = connectionUrl.pathname.replace(/^\//, "");

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  const adapterOptions = {
    host: connectionUrl.hostname,
    port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
    user: decodeURIComponent(connectionUrl.username),
    password: decodeURIComponent(connectionUrl.password),
    database,
  };

  const connectionLimit = connectionUrl.searchParams.get("connection_limit");
  if (connectionLimit) {
    adapterOptions.connectionLimit = Number(connectionLimit);
  }

  const socketTimeout = connectionUrl.searchParams.get("socket_timeout");
  if (socketTimeout) {
    adapterOptions.socketTimeout = Number(socketTimeout);
  }

  return new PrismaMariaDb(adapterOptions);
}

class PrismaClient extends GeneratedPrismaClient {
  constructor(options = {}) {
    const { adapter, ...clientOptions } = options;

    super({
      adapter: adapter ?? createAdapter(),
      ...clientOptions,
    });
  }
}

const Prisma = GeneratedPrisma;

export { Prisma, PrismaClient, createAdapter };
