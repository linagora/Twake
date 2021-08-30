const unoconv = require("unoconv-promise");

export async function convertFromOffice(
  path: string,
  numberOfPages: number,
): Promise<{ output: string; done: boolean }> {
  console.log("Start conversion with unoconv");

  if (numberOfPages >= 1) {
    const outputPath = `${path.split(".")[0]}_temp`;
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    processOutputPath.push("tmp");
    const output = `${processOutputPath.join("/")}/${outputPath.split("/").pop()}`;
    try {
      await unoconv.run({
        file: path,
        output: `${output}`,
        export: `PageRange=1-${numberOfPages}`,
      });
    } catch (err) {
      console.log(err);
      return { output: "", done: false };
    }

    return { output: `${output}.pdf`, done: true };
  }
}
