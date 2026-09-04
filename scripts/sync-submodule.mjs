import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check')
const nestedCompanionDirectory = path.join(repositoryRoot, 'scstw-streamdeck/packages/companion/companion')
const nestedPackagePath = path.join(repositoryRoot, 'scstw-streamdeck/packages/companion/package.json')
const outerCompanionDirectory = path.join(repositoryRoot, 'companion')
const outerPackagePath = path.join(repositoryRoot, 'package.json')
const nestedLicensePath = path.join(repositoryRoot, 'scstw-streamdeck/LICENSE')
const outerLicensePath = path.join(repositoryRoot, 'LICENSE')
const changedFiles = []

function jsonContentsMatch(currentContents, expectedContents) {
	try {
		return JSON.stringify(JSON.parse(currentContents)) === JSON.stringify(JSON.parse(expectedContents))
	} catch {
		return false
	}
}

async function updateFile(filePath, contents, contentsMatch = (current, expected) => current === expected) {
	let currentContents

	try {
		currentContents = await readFile(filePath, 'utf8')
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error
	}

	if (currentContents !== undefined && contentsMatch(currentContents, contents)) return

	changedFiles.push(path.relative(repositoryRoot, filePath))
	if (!checkOnly) {
		await mkdir(path.dirname(filePath), { recursive: true })
		await writeFile(filePath, contents)
	}
}

await updateFile(
	path.join(outerCompanionDirectory, 'HELP.md'),
	await readFile(path.join(nestedCompanionDirectory, 'HELP.md'), 'utf8'),
)

const nestedManifest = JSON.parse(await readFile(path.join(nestedCompanionDirectory, 'manifest.json'), 'utf8'))
const outerManifest = {
	...nestedManifest,
	$schema: '../node_modules/@companion-module/base/assets/manifest.schema.json',
	runtime: {
		...nestedManifest.runtime,
		entrypoint: '../scstw-streamdeck/packages/companion/dist/main.js',
	},
}

await updateFile(
	path.join(outerCompanionDirectory, 'manifest.json'),
	JSON.stringify(outerManifest, null, '\t'),
	jsonContentsMatch,
)

const nestedPackage = JSON.parse(await readFile(nestedPackagePath, 'utf8'))
const outerPackage = JSON.parse(await readFile(outerPackagePath, 'utf8'))

const synchronizedPackageFields = {
	version: nestedPackage.version,
	nodeEngine: nestedPackage.engines?.node,
	baseVersion: nestedPackage.dependencies?.['@companion-module/base'],
	toolsVersion: nestedPackage.devDependencies?.['@companion-module/tools'],
}

for (const [field, value] of Object.entries(synchronizedPackageFields)) {
	if (typeof value !== 'string') {
		throw new Error(`Nested Companion package does not define a valid ${field}`)
	}
}

outerPackage.version = synchronizedPackageFields.version
outerPackage.engines = {
	...outerPackage.engines,
	node: synchronizedPackageFields.nodeEngine,
}
outerPackage.dependencies = {
	...outerPackage.dependencies,
	'@companion-module/base': synchronizedPackageFields.baseVersion,
}
outerPackage.devDependencies = {
	...outerPackage.devDependencies,
	'@companion-module/tools': synchronizedPackageFields.toolsVersion,
}

await updateFile(outerPackagePath, JSON.stringify(outerPackage, null, '\t'), jsonContentsMatch)
await updateFile(outerLicensePath, await readFile(nestedLicensePath, 'utf8'))

if (checkOnly && changedFiles.length > 0) {
	console.error(`Files are out of sync with the scstw-streamdeck submodule:`)
	for (const file of changedFiles) console.error(`- ${file}`)
	console.error('Run `yarn sync-submodule` to update them.')
	process.exitCode = 1
} else if (checkOnly) {
	console.log('Outer publishing files are synchronized with the scstw-streamdeck submodule')
} else if (changedFiles.length > 0) {
	console.log(`Updated from the scstw-streamdeck submodule:`)
	for (const file of changedFiles) console.log(`- ${file}`)
} else {
	console.log('Outer publishing files are already synchronized with the scstw-streamdeck submodule')
}
