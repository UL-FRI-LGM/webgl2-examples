# ES6/WebGL 2.0 Examples
A collection of ES6/WebGL 2.0 examples for undergraduate computer graphics courses.

# Building and running
The examples do not need to be built, but some of them require a server
capable of serving static files (WebGL+CORS restrictions).

If python is installed, a decent enough server for this task is:

```bash
python -m http.server
```

# Project structure
The project is structured as follows:

- The root directory contains `index.html`, the project's front page that
  lists all examples with links to their respective pages.
- The `lib` directory holds the libraries. We use libraries when something
  is too tedious or prone to error if written by hand or out of the scope of
  this project.
- The `common` directory contains all the code and resources that are used
  in multiple examples.
- Finally, the `examples` directory contains a folder for every example.
  Each example holds at least a .html and a .js file as an entry point,
  potentially along with other support files associated with the example.
