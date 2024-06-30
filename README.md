# Minecraft Modpack Update Manager

Minecraft versions go by so quickly now it feels like we constantly have to update our modpacks.
It takes hours to scour Modrinth to try and find newer versions of your mods.
This is where my script comes in.

It will scan your mod folder and automatically search and download them for another Minecraft version and mod loader.

This will give you a great head start when it comes to updating or porting your packs.

It is very easy to use.
You just have to have nodeJS installed and run ModpackUpdateManagerNodeJS.sh

In the end, you will see a comprehensive report of the operation results that will help you manually finalize the details

You can configure the script using the ModpackUpdateManagerNodeJS-config.json file.

In it, you can set:

versions: 				All of the Minecraft versions you want to allow the script to search for
modLoaders: 			All of the Minecraft mod loaders you want to allow the script to search for
searchTermBlacklist: 	All of the words that will be removed from the mod names (like edition or port or unofficial)
chooseVersionFromList: 	Whether you choose the Minecraft version to update to from a list or write it manually
specifyPathWithDialog: 	Whether you paste the mod file path manually or use a Windows dialog to select it
logOutputToFile:		Output all of the text from the prompt to a log file