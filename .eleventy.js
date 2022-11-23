const pluginRss = require("@11ty/eleventy-plugin-rss"); // needed for absoluteUrl feature
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const path = require("path");

// Base setup for builds, needed for og tags and correct image paths
// (mostly for github pages deployment, see build-deploy.yaml)
const baseUrl = process.env.BASE_URL || "http://localhost:8080";
// e.g. 'https://mandrasch.github.io/'
const pathPrefix = process.env.PATH_PREFIX || "/";
// e.g. '/11ty-plain-boostrap5/'
console.log("baseUrl is set to ...", baseUrl);
console.log("pathPrefix is set to ...", pathPrefix);

// will be accessible in all templates via
// see "eleventyConfig.addGlobalData("site", globalData);"" below
// related: https://github.com/11ty/eleventy/issues/1641
const globalSiteData = {
  title: "Health for Uganda",
  description: 'Webseite des Vereins "Health for Uganda e.V."',
  locale: "de",
  baseUrl: baseUrl,
  pathPrefix: pathPrefix,
};

// https://www.11ty.dev/docs/plugins/image/#use-this-in-your-templates
const Image = require("@11ty/eleventy-img");

function imageShortcode(src, alt, sizes = "100vw") {
  console.log(`Generating image(s) from:  ${src}`);
  let options = {
    widths: [600, 1000, 1500, 2400],
    formats: ["webp", "jpeg"],
    urlPath: "/images/",
    outputDir: "./_site/images/",
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  };

  // generate images
  Image(src, options);

  let imageAttributes = {
    alt,
    sizes,
    width: "100%",
    loading: "lazy",
    decoding: "async",
  };
  // get metadata
  metadata = Image.statsSync(src, options);
  return Image.generateHTML(metadata, imageAttributes);
}

function logoShortcode(src, alt, sizes = "100vw", width = 50) {
  console.log(`Generating image(s) from:  ${src}`);
  let options = {
    widths: [width],
    formats: ["webp", "jpeg"],
    urlPath: "/logos/",
    outputDir: "./_site/logos/",
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  };

  // generate images
  Image(src, options);

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };
  // get metadata
  metadata = Image.statsSync(src, options);
  return Image.generateHTML(metadata, imageAttributes);
}

// https://www.npmjs.com/package/eleventy-plugin-gen-favicons
const faviconsPlugin = require("eleventy-plugin-gen-favicons");

module.exports = function (eleventyConfig) {
  // Set site title
  eleventyConfig.addGlobalData("site", globalSiteData);

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(faviconsPlugin, {});

  // Copy dist/ files from laravel mix
  eleventyConfig.addPassthroughCopy("dist/"); // path is relative from root

  // Copy (static) files to output (_site)
  eleventyConfig.addPassthroughCopy("src/assets");

  // Copy transformed images
  eleventyConfig.addPassthroughCopy("img/");

  // Important for watch: Eleventy will not add a watch for files or folders that
  // are in .gitignore (--> dist/),unless setUseGitIgnore is turned off. See this chapter:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets
  eleventyConfig.setUseGitIgnore(false);

  // Watch for changes (and reload browser)
  eleventyConfig.addWatchTarget("./src/assets"); // normal (static) assets
  eleventyConfig.addWatchTarget("./dist"); // laravel-mix output changes

  // RandomId function for IDs used by labelled-by
  // Thanks https://github.com/mozilla/nunjucks/issues/724#issuecomment-207581540
  // TODO: replace with addNunjucksGlobal? https://github.com/11ty/eleventy/issues/1498
  eleventyConfig.addFilter("generateRandomIdString", function (prefix) {
    return prefix + "-" + Math.floor(Math.random() * 1000000);
  });

  // eleventy-img config
  eleventyConfig.addNunjucksShortcode("image", imageShortcode);
  eleventyConfig.addNunjucksShortcode("logo", logoShortcode);

  // Base Config
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes", // this path is releative to input-path (src/)
      layouts: "layouts", // this path is releative to input-path (src/)
      data: "data", // this path is releative to input-path (src/)
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    // important for github pages build (subdirectory):
    pathPrefix: pathPrefix,
  };
};
