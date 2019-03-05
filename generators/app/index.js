let Generator = require('yeoman-generator')

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: 'input',
        name: 'elementName',
        message: 'The name of your custom element',
        default: 'my-element',
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
        message: 'How you would describe your custom element',
        default: 'Cool new web component',
      },
      {
        type: 'list',
        choices: ['none', 'postcss', 'scss', 'sass'],
        name: 'preprocessor',
        message: 'CSS preprocessor to use, if any',
        default: 'none',
      }
    ])
    .then(answers => {
      this.answers = answers
    })
  }

  _helloWorldStyles(preprocessor) {
    if (preprocessor === 'sass') {
      return `:host
  background-color: purple
  color: white
  display: inline-block
  padding: 0.5em`
    }

    return `:host {
  background-color: purple;
  color: white;
  display: inline-block;
  padding: 0.5em;
}`
  }

  writing() {
    let answers = Object.assign({
      className: require('camelcase')(this.answers.elementName, {pascalCase: true}),
      helloWorldStyles: this._helloWorldStyles(this.answers.preprocessor)
    }, this.answers)
    let paths = [
      'bs-config.js',
      'package.json',
      'README.md',
      'demo/index.html',
      'commands/dev.Procfile',
    ]
    let projectDir = answers.elementName
    let projectPath = path => this.destinationPath(`${projectDir}/${path}`)

    paths.forEach(path => {
      this.fs.copyTpl(
        this.templatePath(path),
        projectPath(path),
        answers
      )
    })

    // Stupid NPM
    this.fs.copyTpl(this.templatePath('_dot_gitignore'), projectPath('.gitignore'))

    this.fs.copyTpl(
      this.templatePath('src/my-element.html'),
      projectPath(`src/${answers.elementName}.html`),
      answers
    )

    if (answers.preprocessor === 'postcss') {
      this.fs.copyTpl(
        this.templatePath('postcss.config.js'),
        projectPath('postcss.config.js'),
        answers
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
    process.chdir(this.answers.elementName) // Gotta do an install from the project directory.
    this.npmInstall()
  }

  end() {
    this.spawnCommand('npm', ['run', 'dev'])
  }
}
