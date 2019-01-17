module.exports = function configureGrunt(grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    eslint: {
      default: {
        src: ['src/**/*.js'],
      },
    },
    connect: {
      server: {
        options: {
          port: 8000,
        },
      },
    },
    watch: {
      js: {
        files: ['src/**/*.js'],
        tasks: ['eslint', 'babel'],
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
    babel: {
      output: {
        expand: true,
        cwd: './src',
        src: './**/*.js',
        dest: 'dist/',
      },
    },
  });

  grunt.registerTask('dev', ['eslint', 'connect', 'babel', 'copy', 'watch'])
  grunt.registerTask('build', ['eslint', 'babel', 'copy'])
}
