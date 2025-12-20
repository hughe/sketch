package git

import (
	"bufio"
	"fmt"
	"os/exec"
	"strings"
)

// DiffFile represents a file change in a git diff
type DiffFile struct {
	Path      string `json:"path"`
	OldPath   string `json:"old_path"`
	OldMode   string `json:"old_mode"`
	NewMode   string `json:"new_mode"`
	OldHash   string `json:"old_hash"`
	NewHash   string `json:"new_hash"`
	Status    string `json:"status"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

// GetDiff returns a structured representation of the Git diff between two branches
func GetDiff(repoDir, from, to string) ([]DiffFile, error) {
	rawCmd := exec.Command("git", "-C", repoDir, "diff", "--raw", "--abbrev=40", "-M", "-C", "--find-copies-harder", from, to)
	numstatCmd := exec.Command("git", "-C", repoDir, "diff", "--numstat", from, to)

	rawOut, err := rawCmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("error executing git diff --raw: %w - %s", err, string(rawOut))
	}

	numstatOut, err := numstatCmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("error executing git diff --numstat: %w - %s", err, string(numstatOut))
	}

	return parseRawDiffWithNumstat(string(rawOut), string(numstatOut))
}

// GetFileContent returns the content of a file at a specific git hash
func GetFileContent(repoDir, hash string) (string, error) {
	cmd := exec.Command("git", "-C", repoDir, "show", hash)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("error executing git show: %w - %s", err, string(out))
	}
	return string(out), nil
}

// ValidateBranch checks if a branch exists in the repository
func ValidateBranch(repoDir, branch string) error {
	cmd := exec.Command("git", "-C", repoDir, "rev-parse", "--verify", branch)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("branch %q does not exist", branch)
	}
	return nil
}

func parseRawDiffWithNumstat(rawOutput, numstatOutput string) ([]DiffFile, error) {
	files, err := parseRawDiff(rawOutput)
	if err != nil {
		return nil, err
	}

	numstatMap := make(map[string]struct{ additions, deletions int })

	if numstatOutput != "" {
		scanner := bufio.NewScanner(strings.NewReader(strings.TrimSpace(numstatOutput)))
		for scanner.Scan() {
			line := scanner.Text()
			parts := strings.Split(line, "\t")
			if len(parts) >= 3 {
				additions := 0
				deletions := 0

				if parts[0] != "-" {
					if _, err := fmt.Sscanf(parts[0], "%d", &additions); err != nil {
						additions = 0
					}
				}
				if parts[1] != "-" {
					if _, err := fmt.Sscanf(parts[1], "%d", &deletions); err != nil {
						deletions = 0
					}
				}

				filePath := strings.Join(parts[2:], "\t")
				numstatMap[filePath] = struct{ additions, deletions int }{additions, deletions}
			}
		}
	}

	for i := range files {
		if stats, found := numstatMap[files[i].Path]; found {
			files[i].Additions = stats.additions
			files[i].Deletions = stats.deletions
		}
	}

	return files, nil
}

func parseRawDiff(diffOutput string) ([]DiffFile, error) {
	var files []DiffFile
	if diffOutput == "" {
		return files, nil
	}

	scanner := bufio.NewScanner(strings.NewReader(strings.TrimSpace(diffOutput)))
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, ":") {
			continue
		}

		parts := strings.Fields(line[1:])
		if len(parts) < 5 {
			continue
		}

		oldMode := parts[0]
		newMode := parts[1]
		oldHash := parts[2]
		newHash := parts[3]
		status := parts[4]

		tabIndex := strings.Index(line, "\t")
		if tabIndex == -1 {
			continue
		}

		pathPart := line[tabIndex+1:]

		if strings.HasPrefix(status, "R") || strings.HasPrefix(status, "C") {
			pathParts := strings.Split(pathPart, "\t")
			if len(pathParts) == 2 {
				files = append(files, DiffFile{
					Path:    pathParts[1],
					OldPath: pathParts[0],
					OldMode: oldMode,
					NewMode: newMode,
					OldHash: oldHash,
					NewHash: newHash,
					Status:  status,
				})
			} else {
				files = append(files, DiffFile{
					Path:    pathPart,
					OldPath: "",
					OldMode: oldMode,
					NewMode: newMode,
					OldHash: oldHash,
					NewHash: newHash,
					Status:  status,
				})
			}
		} else {
			files = append(files, DiffFile{
				Path:    pathPart,
				OldPath: "",
				OldMode: oldMode,
				NewMode: newMode,
				OldHash: oldHash,
				NewHash: newHash,
				Status:  status,
			})
		}
	}

	return files, nil
}
