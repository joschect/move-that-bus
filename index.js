const morphin = require("ts-morph");
const Maybe = require("./maybe");
const path = require("path");
const { Project, ModuleResolutionKind } = morphin;

function HandleRenames() {
  const rootPath = process.argv[2];
  const componentName = process.argv[3];

  if (!rootPath) {
    throw "need a path to the root folder";
  }
  if (!componentName) {
    throw "need a component name to change";
  }

  const Proj = new Project({
    compilerOptions: {
      moduleResolution: ModuleResolutionKind.NodeJs,
      noResolve: true,
      traceResolution: false,
    },
  });

  deleteAndMove(Proj, rootPath, componentName);
  repathImports(Proj, rootPath, componentName);
}

function repathImports(Proj, rootPath, componentName) {
  const MovedFiles = Proj.addSourceFilesAtPaths(
    `${rootPath}/packages/react-internal/src/components/${componentName}/**`
  );

  const reg = /\@fluentui\/(react-internal|react|react-next).+\/lib/;
  for (let file of MovedFiles) {
    const imports = file
      .getImportDeclarations()
      .filter((v) => reg.test(v.getText()));
    for (let imp of imports) {
      const impValue = imp.getModuleSpecifier();
      const txt = impValue.getLiteralValue().replace(reg, "");
      const newPath = path.relative(
        file.getFilePath(),
        `${rootPath}/packages/react-internal/src/components/${txt}`
      );
      console.log("renaming ", impValue.getLiteralValue(), " to ", newPath);

      impValue.setLiteralValue(newPath);
    }
  }
  Proj.saveSync();
}

function deleteAndMove(Proj, offPath, componentName) {
  const nextDir = Maybe.of(
    Proj.addDirectoryAtPathIfExists(
      `${offPath}/packages/react-next/src/components/${componentName}`
    )
  );

  const internalDir = Maybe.of(
    Proj.addDirectoryAtPathIfExists(
      `${offPath}/packages/react-internal/src/components/${componentName}`
    )
  );

  const exampleNext = Maybe.of(
    Proj.addDirectoryAtPathIfExists(
      `${offPath}/packages/react-examples/src/react-next/${componentName}`
    )
  );

  const perfFile = Maybe.of(
    Proj.addSourceFileAtPathIfExists(
      `${offPath}/apps/perf-test/src/scenarios/${componentName}Next.tsx`
    )
  );
  const vrFile = Maybe.of(
    Proj.addSourceFileAtPathIfExists(
      `${offPath}/apps/vr-tests/src/stories/${componentName}Next.stories.tsx`
    )
  );

  internalDir.then((v) => v.deleteImmediately());

  nextDir.then((v) =>
    v.moveToDirectory(
      Proj.addDirectoryAtPath(
        `${offPath}/packages/react-internal/src/components/`
      )
    )
  );

  // Don't need to move examples yet, just delete next examples
  exampleNext.then((v) => v.deleteImmediately());

  perfFile.then((p) => p.delete());

  vrFile.then((vr) => vr.delete());

  // Need to save synchronously so that the changes are available
  Proj.saveSync();
}

HandleRenames();
