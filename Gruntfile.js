module.exports = function configureGrunt(grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    parallel: {
      development: {
        options: {
          stream: true,
        },
        tasks: [
          {
            grunt: true,
            args: ['connect'],
          },
          {
            grunt: true,
            args: ['watch'],
          },
          {
            grunt: true,
            args: ['copy'],
          },
          {
            grunt: true,
            args: ['shell:rollupDev'],
          },
        ],
      },
    },
    connect: {
      server: {
        options: {
          port: 8000,
          keepalive: true,
        },
      },
    },
    watch: {
      js: {
        files: ['src/**/*.js'],
        options: {
          livereload: true,
        },
      },
      css: {
        files: ['src/**/*.css'],
        tasks: ['copy'],
      },
    },
    copy: {
      css: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['./**/*.css'],
            dest: 'dist/',
          },
        ],
      },
    },
    shell: {
      rollupDev: {
        command: './node_modules/.bin/rollup -c rollup.config.js -w',
      },
      rollupProd: {
        command: './node_modules/.bin/rollup -c rollup.config.js',
      },
    },
  })

  grunt.registerTask('build', ['copy', 'shell:rollupProd'])
}
