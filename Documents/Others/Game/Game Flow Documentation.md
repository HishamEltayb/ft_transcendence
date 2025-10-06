# Complete Game Flow Sequence: From Initialization to Victory

## 1. Initial Page Load (0ms - 500ms)

| Step | Description |
| --- | --- |
| 1.1 | Browser parses HTML/CSS |
| 1.2 | JavaScript executes initial DOM setup |
| 1.3 | Default positions calculated via gameWidth/2 - paddle.clientWidth/2 |
| 1.4 | Player names set to defaults |
| 1.5 | All screens hidden (navigation menu remains visible) |

## 2. UI Exploration: "How to Play" (User action)

| Step | Description |
| --- | --- |
| 2.1 | Mouse click triggers event listener |
| 2.2 | hideAllScreens() hides all UI panels via forEach |
| 2.3 | setActiveNavButton(howToPlayButton) adds 'active' CSS class with highlighting |
| 2.4 | Instructions screen becomes visible |

## 3. Navigation to Settings (User action)

| Step | Description |
| --- | --- |
| 3.1 | Click event propagates to settingsButton listener |
| 3.2 | Previous screen (how-to-play) hidden |
| 3.3 | Settings button receives visual highlight |
| 3.4 | Settings panel appears with form controls |

## 4. Configuration Updates (User inputs)

| Step | Description |
| --- | --- |
| 4.1 | User modifies DOM elements: |
| 4.2 | winScoreSelect.value = "3"; // Points to win |
| 4.3 | player1NameInput.value = "mohamoha"; // Player name |
| 4.4 | aiDifficultySelect.value = "hard"; // AI level |
| 4.5 | Form inputs store values but don't apply them yet |
| 4.6 | Game variables remain unchanged until explicitly saved |

## 5. Settings Application (User action)

| Step | Description |
| --- | --- |
| 5.1 | Save button triggers settings application |
| 5.2 | Game parameters updated from form values |
| 5.3 | AI difficulty parameters configured (but not active yet) |
| 5.4 | UI returns to play screen |

## 6. Game Mode Selection (User action)

| Step | Description |
| --- | --- |
| 6.1 | Click on PVE (Player vs AI) button |
| 6.2 | isAIMode flag enabled (critical for paddle2 behavior) |
| 6.3 | "Press any key" prompt displayed |
| 6.4 | applySettings() re-executed with isAIMode=true |
| 6.5 | AI parameters fully configured |
| 6.6 | resetGame() positions elements and resets scores |

## 7. Game Start (User action)

| Step | Description |
| --- | --- |
| 7.1 | Any key press triggers game start |
| 7.2 | Ball becomes visible |
| 7.3 | Navigation buttons disabled |
| 7.4 | Game loop activated with timestamp |

## 8. Game Loop Execution (16-17ms intervals)

| Step | Description |
| --- | --- |
| 8.1 | Animation frame executes ~60 times per second |
| 8.2 | Delta time calculation ensures consistent speed |
| 8.3 | Human paddle responds to keyboard input |
| 8.4 | AI paddle uses hard difficulty prediction algorithms |
| 8.5 | Collisions calculated with precise physics |

## 9. AI Decision Making (Each frame)

| Step | Description |
| --- | --- |
| 9.1 | AI perception update (based on reaction delay) |
| 9.2 | Update AI's perception of ball position |
| 9.3 | Mistake chance (15% on hard) |
| 9.4 | Introduce controlled error |
| 9.5 | Calculate where to position paddle |
| 9.6 | Convert to keyboard simulation |
| 9.7 | Execute movement using simulated keyboard state |
| 9.8 | Apply physics & boundary limits |

## 10. Scoring & Game Progress

| Step | Description |
| --- | --- |
| 10.1 | Ball physics updated each frame |
| 10.2 | Scoring triggers sound effect & score update |
| 10.3 | Ball reset after each point |
| 10.4 | Win condition checks after each score |

## 11. Victory Screen (Final state)

| Step | Description |
| --- | --- |
| 11.1 | Game state variables updated to prevent further gameplay |
| 11.2 | Victory message displays winner's name ("mohamoha") |
| 11.3 | Final score displayed (3-1) |
| 11.4 | Navigation buttons re-enabled for next actions |
| 11.5 | Restart button becomes visible |

