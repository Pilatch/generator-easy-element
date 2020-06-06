let easyElementVersion = '1.8.6'
let Generator = require('yeoman-generator')
let projectTypes = {
  SINGLE_ELEMENT: 'single element',
  MULTI_COMPONENT: 'multi-component library',
}
let neverAsk = () => false
let isSingleElementProject = answers => answers.projectType === projectTypes.SINGLE_ELEMENT
let isMultiComponentProject = answers => answers.projectType === projectTypes.MULTI_COMPONENT
let styleSyntax = preprocessor => {
  if (preprocessor === 'sass') {
    return {
      lb: '',
      rb: '',
      sc: '',
    }
  }

  return {
    lb: ' {',
    rb: '\n}',
    sc: ';',
  }
}

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: 'list',
        name: 'projectType',
        choices: [projectTypes.SINGLE_ELEMENT, projectTypes.MULTI_COMPONENT],
        default: projectTypes.SINGLE_ELEMENT,
        message: 'What kind of project are we creating?',
      },
      {
        type: 'input',
        name: 'projectDir',
        message: 'The name of your project folder',
        default: 'component-library',
        when: isMultiComponentProject,
      },
      {
        type: 'input',
        name: 'elementName',
        message: 'The name of your custom element',
        default: 'my-element',
        when: isSingleElementProject,
        validate: value => {
          if (value.includes('-')) {
            return true
          }

          return 'Must include a hyphen!'
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'How you would describe your project',
        default: 'New web component project',
      },
      {
        type: 'list',
        choices: ['none', 'postcss', 'scss', 'sass'],
        name: 'preprocessor',
        message: 'CSS preprocessor to use, if any',
        default: 'none',
      },
      {
        type: 'checkbox',
        name: 'isSingleElementProject',
        when: neverAsk,
      },
      {
        type: 'input',
        name: 'easyElementVersion',
        when: neverAsk,
      }
    ])
    .then(answers => {
      this.answers = answers
    })
  }

  _commentedOutHtmlTemplate() {
    return `<!--
<template>
  Structure the inside of your element
</template>
-->`
  }

  _helloWorldHtmlTemplate(editWhat) {
    return `<template>
  Edit ${editWhat} to make changes.
</template>`
  }

  _multiSquareHtmlTemplate() {
    return `<template>
  <blue-square></blue-square>
  <red-square></red-square>
</template>`
  }

  _helloWorldStyles(preprocessor) {
    if (preprocessor === 'sass') {
      return `:host
  background-color: purple
  color: white
  font-family: sans-serif
  display: inline-block
  padding: 0.5em`
    }

    return `:host {
  background-color: purple;
  color: white;
  font-family: sans-serif;
  display: inline-block;
  padding: 0.5em;
}`
  }

  _multiSquareStyles(preprocessor) {
    let {lb, rb, sc} = styleSyntax(preprocessor)

    return `:host${lb}
  display: inline-block${sc}
  width: 90px${sc}
  height: 60px${sc}
  position: relative${sc}${rb}
:host blue-square, :host red-square${lb}
  position: absolute${sc}
  left: 0${sc}
  top: 0${sc}${rb}
:host blue-square${lb}
  left: 30px${sc}${rb}`
  }

  _squareStyles(preprocessor, color) {
    let {lb, rb, sc} = styleSyntax(preprocessor)

    return `:host${lb}
  background-color: ${color}${sc}
  opacity: .5${sc}
  display: inline-block${sc}
  width: 60px${sc}
  height: 60px${sc}${rb}`
  }

  writing() {
    this.answers.isSingleElementProject = isSingleElementProject(this.answers)
    this.answers.easyElementVersion = easyElementVersion

    let simplePaths = [
      'bs-config.js',
      'README.md',
    ]

    if (this.answers.isSingleElementProject) {
      this.answers.className = require('camelcase')(this.answers.elementName, {pascalCase: true})
      this.answers.projectDir = this.answers.elementName
      this.answers.helloWorldStyles = this._helloWorldStyles(this.answers.preprocessor)
    } else {
      this.answers.className = null
      this.answers.helloWorldStyles = null
    }

    let projectPath = path => this.destinationPath(`${this.answers.projectDir}/${path}`)

    simplePaths.forEach(path => {
      this.fs.copyTpl(
        this.templatePath(path),
        projectPath(path),
        this.answers
      )
    })

    // Stupid NPM
    this.fs.copyTpl(this.templatePath('_dot_gitignore'), projectPath('.gitignore'))

    if (isSingleElementProject(this.answers)) {
      this.fs.copyTpl(
        this.templatePath('src/custom-element.html'),
        projectPath(`src/${this.answers.elementName}.html`),
        {
          htmlTemplate: this._helloWorldHtmlTemplate(`<strong>src/${this.answers.elementName}.html</strong>`),
          preprocessor: this.answers.preprocessor,
          className: this.answers.className,
          styles: this._helloWorldStyles(this.answers.preprocessor),
        }
      )
      this.fs.copyTpl(
        this.templatePath('_singleElement_package.json'),
        projectPath(`package.json`),
        this.answers
      )
    } else {
      this.fs.copyTpl(
        this.templatePath('_multiComponent_package.json'),
        projectPath(`package.json`),
        this.answers
      )
      this.fs.copyTpl(
        this.templatePath('src/custom-element.html'),
        projectPath(`src/a-message.html`),
        {
          htmlTemplate: this._helloWorldHtmlTemplate('stuff in the <strong>src</strong> folder'),
          preprocessor: this.answers.preprocessor,
          className: 'AMessage',
          styles: this._helloWorldStyles(this.answers.preprocessor),
        }
      )
      this.fs.copyTpl(
        this.templatePath('src/custom-element.html'),
        projectPath(`src/red-square.html`),
        {
          htmlTemplate: this._commentedOutHtmlTemplate(),
          preprocessor: this.answers.preprocessor,
          className: 'RedSquare',
          styles: this._squareStyles(this.answers.preprocessor, 'red'),
        }
      )
      this.fs.copyTpl(
        this.templatePath('src/custom-element.html'),
        projectPath(`src/blue-square.html`),
        {
          htmlTemplate: this._commentedOutHtmlTemplate(),
          preprocessor: this.answers.preprocessor,
          className: 'BlueSquare',
          styles: this._squareStyles(this.answers.preprocessor, 'blue'),
        }
      )
      this.fs.copyTpl(
        this.templatePath('src/custom-element.html'),
        projectPath(`src/multi-square.html`),
        {
          htmlTemplate: this._multiSquareHtmlTemplate(),
          preprocessor: this.answers.preprocessor,
          className: 'MultiSquare',
          styles: this._multiSquareStyles(this.answers.preprocessor),
        }
      )
    }

    if (this.answers.preprocessor === 'postcss') {
      this.fs.copyTpl(
        this.templatePath('postcss.config.js'),
        projectPath('postcss.config.js'),
        this.answers
      )

      let morePackageJson = {
        devDependencies: {
          'postcss-nested': '^4.1.1'
        }
      }

      this.fs.extendJSON(projectPath('package.json'), morePackageJson)
    }
  }

  install() {
    process.chdir(this.answers.projectDir) // Gotta do an install from the project directory.
    this.npmInstall()
  }

  end() {
    let maybeBundleFlag = isSingleElementProject(this.answers)
      ? null
      : '--bundle'

    this.spawnCommand('npx', ['easy-element', 'demo', 'src', maybeBundleFlag].filter(Boolean))
    // Build before running dev so there isn't a race condition with the browser
    // possibly loading the demo page before the compiled JS has been written.
    this.spawnCommand('npx', ['easy-element', 'build', 'src', maybeBundleFlag].filter(Boolean))
    this.spawnCommand('npm', ['run', 'dev'])
  }
}
