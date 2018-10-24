module.exports = function(grunt) {

  var srcDir = 'src/';
  var outDir = 'built/';
  var outDirExtracted = outDir + "/release/";
  var outXpi = outDir + "/AutoArchiveReloaded.xpi";

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      clean: [outDir],
      copy: {
        main: {
          files: [
            {expand: true, cwd: srcDir, src: ['**','!**/*.ts'], dest: outDirExtracted},
          ],
        },
      },
      ts: {
        default : {
          tsconfig: './tsconfig.json'
        },
      },
      // make a zipfile
      compress: {
        main: {
          options: {
            archive: outXpi,
            mode: 'zip'
          },
          files: [
            {expand: true, cwd: outDirExtracted, src: ['**'], dest: '/'}, // makes all src relative to cwd
          ]
        }
      }
    });
  
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Default task(s).
    grunt.registerTask('default', ['clean','copy','ts','compress']);
};