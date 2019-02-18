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
        type: 'confirm',
        name: 'postcss',
        message: 'Use postcss as your CSS preprocessor?',
        default: false,
      }
    ])
    .then(answers => {
      this.answers = answers
    })
  }

  writing() {
    let answers = Object.assign({
      className: require('camelcase')(this.answers.elementName, {pascalCase: true}),
    }, this.answers)
    let paths = [
      'bs-config.js',
      'package.json',
      'README.md',
      'demo/index.html',
      'commands/dev.Procfile',
    ]

    paths.forEach(path => {
      this.fs.copyTpl(
        this.templatePath(path),
        this.destinationPath(path),
        answers
      )
    })

    // Stupid NPM
    this.fs.copyTpl(this.templatePath('_dot_gitignore'), this.destinationPath('.gitignore'))

    this.fs.copyTpl(
      this.templatePath('src/my-element.html'),
      this.destinationPath(`src/${answers.elementName}.html`),
      answers
    )

    if (answers.postcss) {
      this.fs.copyTpl(
        this.templatePath('postcss.config.js'),
        this.destinationPath('postcss.config.js'),
        answers
      )

      let morePackageJson = {
        devDependencies: {
          'postcss-nested': '^4.1.1'
        }
      }

      this.fs.extendJSON(this.destinationPath('package.json'), morePackageJson)
    }
  }

  install() {
    this.npmInstall()
  }

  end() {
    this.spawnCommand('npm', ['run', 'dev'])
  }
}
