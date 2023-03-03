import { spawn } from "child_process";

export const runCommand = (
  command: string,
  args: string[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args);

    let output = "";

    cmd.stdout.on("data", (data) => {
      output += data;
    });

    cmd.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    cmd.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command ${command} failed with code ${code}`));
      }
    });
  });
};
