Webpan is currently under development, you can join [this Discord server](https://discord.gg/bdRnwpYHGp) to be notified for updates.

# Overview

Webpan is a *hackable*, *format-agnostic* build tool that can be used for:
- Static site generation, such as creating wiki and blog sites.
- Publishing massive and loosely-organised notes folders.
- Or any other user-defined conversion tasks.

## Rule-based Configuration

Each Webpan project has a folder structure as below
```
src/
├── wrules.json
├── hello.html
├── blogs/
│   ├── i-am-currently-working-on-webpan.md
│   └── so-i-can-use-it-to-publish-my-notes.md
└── notes/
    ├── basic-set-notations.md
    ├── exercise-1a.tex
    └── exercise-1b.typ
```

In `wrules.json`, we can define which ***processor*** should be used for each file.
```jsonc
{
    "/blogs/*.md": {
        "wp-markdown": {
            "plugins": [ "blogpost" ]
        }
    },
    "/notes/*.md": {
        "wp-markdown": {
            "plugins": [ "katex" ] 
        }
    },
    "/notes/*.tex": "wp-latex",
    "/notes/*.typ": "wp-typst",
    "**.html": "wp-copy",
    "**/": "wp-index",
}
```

This will create a folder with the following content.

```
dist/
├── hello.html
├── blogs/
│   ├── i-am-currently-working-on-webpan.html
│   └── so-i-can-use-it-to-publish-my-notes.html
└── notes/
    ├── basic-set-notations.html
    ├── exercise-1a.pdf
    └── exercise-1b.pdf
```

## Extendable

Each processor is just an ordinary npm package you can install with

```sh
npm install package-name
```

You can also create your own processor, below is the implementation for `wp-copy`, which copies the file from `src/` to `dist/`.

```ts
export default class CopyProcessor extends webpan.Processor {
    async build(content: Buffer | "dir"): Promise<ProcessorOutput> {
        return {
              // where in dist/ to write to
              files: new Map({
                  [ this.fileName() ]: content
              }),
              result: null
        }
    }
}
```

A processor can depend on other processors, for example an `index.html` can be generated for each directory. This is the implementation of `wp-index`.

```ts
export default class IndexProcessor extends webpan.Processor {
    async build(content: Buffer | "dir"): Promise<ProcessorOutput> {
        let files: string[] = []

        // loops over the processors to see what files is in /dist
        for(const [filePath, fileHandles] of this.files()) {
            for(const processor of fileHandles.procs().values().flatMap(handleSet => namedHandles.values())) {
                const res = await handle.getResult()
                files = files.concat(Array.from(res.files).map((s) => `${s} ${JSON.stringify(res)}`))
            }
        }

        // create a list of URLs for navigation
        let content = files.map(entry => `<li><a href="${entry}">${entry}</a></li>`).join()

        return {
            files: new Map({
                "index.html": content
            }),
            result: null
        }
    }
}
```

Fundamentally, a processor is something that takes in an input buffer and return one or more output buffers.

## Misc Features

### Incremental Building

Only build the relevant files on change! This allows for very fast rebuilds, which is a prerequisite for instant preview functionality in popular static site generator such as VitePress.

### Nestable Rule Files

Each directory can have its own `wrules.json`, so the build rules for each subfolder can be entirely self contained.
