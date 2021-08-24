const unoconv = require("unoconv-promise");

export async function convertFromOffice(
  document: { id: string; path: string; provider: string },
  numberOfPages: number,
) {
  if (numberOfPages >= 1) {
    const outputPath = `${document.path.split(".")[0]}_temp`;
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    processOutputPath.push("tmp");
    const output = `${processOutputPath.join("/")}/${outputPath.split("/").pop()}`;
    await unoconv
      .run({
        file: document.path,
        output: `${output}`,
        export: `PageRange=1-${numberOfPages}`,
      })
      .catch((e: any) => {
        throw e;
      });

    return `${output}.pdf`;
  }
}
