set REACT_NATIVE_PACKAGER_HOSTNAME=%1
for %%f in (%temp%\haste-map-*) do del %%f
for %%f in (%temp%\haste-map-*) do rmdir /q /s %%f
npm run start0
