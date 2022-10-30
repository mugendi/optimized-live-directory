<!--
 Copyright (c) 2022 Anthony Mugendi

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# optimized-live-directory

This module uses [nile-directory](https://www.npmjs.com/package/nile-directory) to manage static resources. But more than just managing the resources, it ensures that all resources that can be minified are kept minified.

Minification works for css, images, html (by default) and javascript (if user enabled). Because LiveDirectory manages resource watching and reloading, then the re-done whenever resources change.

THis ensures your site is and remains fully optimized. Additionally, because LiveDirectory essentially keeps resources in memory, your site works without dealing with disk I/O for most on of the time.

It is unlikely that you will use this module alone. It is created to be used as part of [live-directory-static](https://www.npmjs.com/package/live-directory-static).

See [How To Use](/readme.md)
