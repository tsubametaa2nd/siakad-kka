import { hash, verify } from "@node-rs/argon2";

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, {
    algorithm: 2, // 2 = argon2id
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await verify(hash, password);
};

