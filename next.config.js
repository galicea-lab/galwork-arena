/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  output: 'export',

  compress: false,
  trailingSlash: true,
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  
  // DODAJ TĘ SEKCJĘ - pusty obiekt turbopack
  turbopack: {},
  
  // USUŃ CAŁY experimental (szczególnie turbopack: false)
  // experimental: {},
  
  // USUŃ transpilePackages jeśli nie potrzebujesz MUI
  // transpilePackages: [...],
  
  // USUŃ CAŁY webpack - Turbopack go nie obsługuje
  // webpack: (config) => { ... }
}

module.exports = withBundleAnalyzer(nextConfig)