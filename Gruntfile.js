'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    jshint: {
      gruntfile: {
        src: 'Gruntfile.js',
        options: {
          node: true
        }
      },
      src: {
        src: 'videojs.thumbnails.js'
      }
    },
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    watch: {
      js: {
        files: ['dist/**/*.js'],
        options: {
          livereload: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['connect', 'watch']);
};
