const morphin = require("ts-morph");
const Maybe = require("./maybe");
var fs = require('fs');
var path = require("path");
const { Project, ScriptTarget, ModuleResolutionKind } = morphin;

const startPath = __dirname;
try {
  const offPath = process.argv[2];
  const componentName = process.argv[3];

  if (!offPath) {
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

  deleteAndMove(Proj, offPath, componentName);
  
  Proj.save();
    const MovedFiles = Proj.addSourceFilesAtPaths(
      `${offPath}/packages/react-internal/src/components/${componentName}/**`
    )

    let reg = /\@fluentui\/(react-internal|react|react-next).+\/lib/
    for(let file of MovedFiles) {
      let imports = file.getImportDeclarations().filter(v => reg.test(v.getText()));
        for(let imp of imports) {
          let impValue = imp.getModuleSpecifier();
          let txt = impValue.getLiteralValue().replace(reg, '');
          console.log("renaming ", txt.getLiteralValue(), " to ", path.relative(file.getFilePath(), `${offPath}/packages/react-internal/src/components/${txt}`));

          impValue.setLiteralValue(path.relative(file.getFilePath(), `${offPath}/packages/react-internal/src/components/${txt}`));
      }
    }
  Proj.save();
} catch (e) {
  throw e;
} finally {
  process.cwd(startPath);
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
  // const exampleReact = Maybe(
  //   Proj.addDirectoryAtPathIfExists(
  //     `${path}/packages/react-examples/src/react/${componentName}`
  //   )
  // );
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

  nextDir.then(v => v.moveToDirectory(
    Proj.addDirectoryAtPath(`${offPath}/packages/react-internal/src/components/`)
  ));

  // Don't need to move examples yet, just delete next examples
  exampleNext.then( v=> v.deleteImmediately())
  //   exampleReact.then(e => {
  //     e.deleteImmediately();
  //   });
  //   return v.moveToDirectory( Proj.addDirectoryAtPath(`${path}/packages/react-examples/src/react/`));
  // });

  perfFile.then(p => p.delete());

  vrFile.then(vr => vr.delete());

  // Save deletions and moves and move to phase 2. Renames!
}

/** 
move:clean
	mv ./packages/react-next/src/components/$(name)/ ./packages/react-internal/src/components/$(name)/
	mv ./packages/react-examples/src/react-next/$(name)/ ./packages/react-examples/src/react/

clean:checkname
	rm -r -f ./packages/react-internal/src/components/$(name)
	rm -r -f ./packages/react-examples/src/react/$(name)
	rm -r -f ./apps/perf-test/src/scenarios/$(name)Next.tsx
	rm -r -f ./apps/vr-tests/src/stories/$(name)Next.stories.tsx

checkname:
ifdef name
	@echo moving $(name)
else
	$(error no component name has been defined)
endif
*/
