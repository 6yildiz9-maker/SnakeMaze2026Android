tasks.register<Exec>("assembleDebug") {
    workingDir = rootDir
    commandLine("npm", "run", "build")
}

tasks.register<Exec>("lintDebug") {
    workingDir = rootDir
    commandLine("npm", "run", "lint")
}
