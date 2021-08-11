const unoconv = require("unoconv-promise");

export async function convertFromOffice(
  inputPath: string,
  outputPath: string,
  numberOfPages: number,
) {
  if (numberOfPages >= 1) {
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    processOutputPath.push("tmp");
    const output = `${processOutputPath.join("/")}/${outputPath.split("/").pop()}`;
    await unoconv
      .run({
        file: inputPath,
        output: `${output}`,
        export: `PageRange=1-${numberOfPages}`,
      })
      .catch((e: any) => {
        throw e;
      });

    return `${output}.pdf`;
  }
}
