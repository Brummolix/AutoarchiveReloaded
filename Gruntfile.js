module.exports = function(grunt) {

  let srcDir = 'src/';
  let outDir = 'built/';
  let outDirExtracted = outDir + "/release/";
  let outXpi = outDir + "/AutoArchiveReloaded.xpi";

  let srcDirShared = outDirExtracted + 'webextension/shared/';
  let destDirShared = outDirExtracted + 'chrome/content/shared/';

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      clean: [outDir],
      copy: {
        main: {
          files: [
            {expand: true, cwd: srcDir, src: ['**','!**/*.ts'], dest: outDirExtracted},
            {expand: true, src: ['./licence.txt','./README.md'], dest: outDirExtracted},
          ],
        },
        shared: {
          files: [
            {expand: true, cwd:srcDirShared, src: ['**'], dest: destDirShared},//cwd:srcDirShared,
          ],
        },
      },
      ts: {
        default : {
          tsconfig: './tsconfig.json'
        },
        release: {
          tsconfig: './tsconfig.release.json'
        }
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
      },
    });
  
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Default task(s).
    grunt.registerTask('default', ['clean','copy','ts:default',/*'copy:shared',*/'compress']);
    grunt.registerTask('release', ['clean','copy','ts:release',/*'copy:shared',*/'compress']);
};