const morphin = require("ts-morph");
const { Maybe } = require("./maybe");
const { Project, ScriptTarget, ModuleResolutionKind } = morphin;

const startPath = __dirname;
try {
  const path = process.argv[2];
  const componentName = process.argv[3];

  if (!path) {
    throw "need a path to the root folder";
  }
  if (!componentName) {
    throw "need a component name to change";
  }

  const Proj = new Project({
    compilerOptions: {
      target: ScriptTarget.ES2015,
      moduleResolution: ModuleResolutionKind.NodeJs,
      noResolve: true,
      traceResolution: false,
    },
  });
  const nextDir = Maybe(
    Proj.addDirectoryAtPathIfExists(
      `${path}/packages/react-next/src/components/${componentName}`
    )
  );
  const internalDir = Maybe(
    Proj.addDirectoryAtPathIfExists(
      `${path}/packages/react-internal/src/components/${componentName}`
    )
  );
  const exampleNext = Maybe(
    Proj.addDirectoryAtPathIfExists(
      `${path}/packages/react-examples/src/react-next/${componentName}`
    )
  );
  const exampleReact = Maybe(
    Proj.addDirectoryAtPathIfExists(
      `${path}/packages/react-examples/src/react/${componentName}`
    )
  );
  const perfFile = Maybe(
    Proj.addSourceFileAtPathIfExists(
      `${path}/apps/perf-test/src/scenarios/${componentName}Next.tsx`
    )
  );
  const vrFile = Maybe(
    Proj.addSourceFileAtPathIfExists(
      `${path}/apps/vr-tests/src/stories/${componentName}Next.stories.tsx`
    )
  );

  internalDir.then((v) => v.deleteImmediately());

  nextDir.then(v => v.moveToDirectory(
    Proj.addDirectoryAtPath(`${path}/packages/react-internal/src/components/`)
  ));

  exampleNext.then( v=>  {
    exampleReact.then(e => {
      e.deleteImmediately();
    });
    return v.moveToDirectory( Proj.addDirectoryAtPath(`${path}/packages/react-examples/src/react/`));
  });

  perfFile.then(p => p.delete());

  vrFile.then(vr => vr.delete());

  // Save deletions and moves and move to phase 2. Renames!
  Proj.save();
} catch (e) {
  throw e;
} finally {
  process.cwd(startPath);
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
