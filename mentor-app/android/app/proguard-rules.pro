# Android creates this from the manifest by name, so R8 must not rename it.
-keep class com.evzomethod.mentor.MainActivity

# There is no JavascriptInterface in this app - the page is self-contained and
# never calls into Kotlin - so nothing else needs keeping.
