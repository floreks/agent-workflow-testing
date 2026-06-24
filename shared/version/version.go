// Package version exposes build-time version metadata for the application.
package version

import "fmt"

// Semantic version components.
const (
	Major = 0
	Minor = 2
	Patch = 0
)

// AppVersion is the canonical semver string, e.g. "0.2.0".
const AppVersion = "0.2.0"

// BuildMetadata can be overridden at link time via:
//
//	-ldflags "-X agent-workflow-testing/shared/version.BuildMetadata=<value>"
var BuildMetadata = "dev"

// FullVersion returns AppVersion with optional build metadata appended,
// e.g. "0.2.0+abc1234" when BuildMetadata is set to a commit hash.
func FullVersion() string {
	if BuildMetadata == "" || BuildMetadata == "dev" {
		return AppVersion
	}
	return fmt.Sprintf("%s+%s", AppVersion, BuildMetadata)
}
