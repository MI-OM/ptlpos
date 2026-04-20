declare module 'bcrypt' {
  export function hash(
    data: string | Buffer,
    saltOrRounds: string | number,
    callback: (err: Error | null, encrypted: string) => void,
  ): void;
  export function hash(
    data: string | Buffer,
    saltOrRounds: string | number,
  ): Promise<string>;
  export function compare(
    data: string | Buffer,
    encrypted: string,
    callback: (err: Error | null, same: boolean) => void,
  ): void;
  export function compare(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean>;
  export const genSalt: {
    (callback: (err: Error | null, salt: string) => void): void;
    (rounds: number, callback: (err: Error | null, salt: string) => void): void;
    (rounds: number, minor: number, callback: (err: Error | null, salt: string) => void): void;
  };
}
