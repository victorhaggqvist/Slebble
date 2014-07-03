/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      css: {
        src: ['build/bootstrap.min.css','build/app.min.css'],
        dest: 'dist/pebble-settings.min.css'
      }
    },
    uglify: {
      dev: {
        options: {
          beautify: true,
          mangle: false
        },
        src: 'js/app.js',
        dest: 'dist/pebble-settings.min.js'
      },
      dist: {
        src: 'js/app.js',
        dest: 'dist/pebble-settings.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {}
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      main: {
        src: ['js/app.js']
      }
    },
    qunit: {
      // files: ['test/**/*.html']
    },
    watch: {
      fluff: {
        options: { livereload:true },
        files: ['./sass/*','./index.html','./js/*'],
        tasks: ['makejsdev','sass-fast']
      }
    },
    sass: {
      bootstrap: {
        options: {
          style: 'compressed',
          loadPath: 'bower_components/bootstrap-sass-twbs/assets/stylesheets/bootstrap'
        },
        files: {
          './build/bootstrap.min.css': './sass/bootstrap.scss'
        }
      },
      main: {
        options: {
          style: 'compressed'
        },
        files: {
          'build/app.min.css': './sass/app.scss'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task.
  grunt.registerTask('default', ['sass', 'concat', 'jshint:main', 'uglify']);

  grunt.registerTask('sass-fast', ['sass:main', 'concat:css']);
  grunt.registerTask('makejsdev', ['jshint:main', 'uglify:dev']);
  grunt.registerTask('makejs', ['jshint:main', 'uglify:dist']);



};
