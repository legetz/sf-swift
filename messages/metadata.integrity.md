# description
Scan recent git history for deleted metadata and detect lingering references across access control, source code, layouts, and flows.

# args.path.description
Path to the Salesforce project root to analyze. Defaults to current directory if not provided.

# flags.targetDir.description
Directory containing metadata to analyze. Defaults to current working directory.

# flags.config.description
Path to a YAML config file to load instead of searching for .swiftrc.

# flags.gitDepth.description
Number of commits to inspect for deletions. Values greater than available history will be clamped.

# flags.testWithClass.description
Treat provided Apex class names as manually removed for integrity checks. Repeat flag to test multiple classes.

# flags.testWithField.description
Treat provided field API names (`Object.Field__c`) as manually removed for integrity checks. Repeat flag to test multiple fields.

# examples
- Analyze latest 5 commits in the current directory:
  <%= config.bin %> <%= command.id %>

- Analyze a specific project root with deeper history:
  <%= config.bin %> <%= command.id %> ./force-app/main/default --git-depth 10

# log.noDeletions
✅ No metadata deletions detected in the selected commit range.

# log.elapsed
⏱️ Completed in %s seconds.

# log.removedHeader
🗑️ Found %d removed metadata item(s) within the last %d commit(s):

# log.depthClamped
ℹ️ Git history only contained %d commit(s); requested depth of %d was clamped.

# log.metadataAnalysisComplete
🔍 Scanned %d permission file(s) for Apex access references.

# log.sourceAnalysisComplete
🔍 Scanned %d code file(s) for Apex class references.

# log.flowAnalysisComplete
🔍 Scanned %d flow file(s) for Apex class and field references.

# log.formulaAnalysisComplete
🔍 Scanned %d custom field file(s) for formula references.

# log.layoutAnalysisComplete
🔍 Scanned %d layout file(s) for field references.

# log.validationAnalysisComplete
🔍 Scanned %d object metadata file(s) for validation rule field references.

# log.fieldSetAnalysisComplete
🔍 Scanned %d field set file(s) for field references.

# log.recordTypeAnalysisComplete
🔍 Scanned %d record type file(s) for field references.

# log.compactLayoutAnalysisComplete
🔍 Scanned %d compact layout file(s) for field references.

# log.noIssues
✅ No lingering references detected. Metadata integrity looks good!

# log.issuesHeader
❌ Detected %d metadata integrity issue(s):

# warn.analysisFailed
⚠️ Skipped analysis for %s: %s

# warn.notGitRepo
⚠️ %s is not a Git repository. Skipping deletion analysis.

# warn.gitError
⚠️ Unable to analyze Git history: %s

# warn.testWithClassInvalid
⚠️ Ignoring --test-with-class value '%s'. Provide a valid Apex class name (alphanumeric plus underscores).

# warn.testWithFieldInvalid
⚠️ Ignoring --test-with-field value '%s'. Provide a field API name in the form `Object.Field`.

# warn.testWithClassDisabled
⚠️ Skipping --test-with-class values because Apex class checks are disabled by config.

# warn.testWithFieldDisabled
⚠️ Skipping --test-with-field values because custom field checks are disabled by config.

# error.issuesFound
Detected %d metadata integrity issue(s). See above for details.
