// AT THIS POINT I WILL EDIT THE ID'S TO CLASSES!


// --------------------------- VARIABLES ---------------------------
// #region
const pieces = ["O", "I", "S", "Z", "L", "J", "T"];
var next_pieces = [];

var playing_field = {};
var spawning_requirements = {
	"O": {"0": ["4", "5"], "1": ["4", "5"]},
	"I": {"0": ["3", "4", "5", "6"]},
	"S": {"0": ["4"], "1": ["4", "5"], "2": ["5"]},
	"Z": {"0": ["5"], "1": ["4", "5"], "2": ["4"]},
	"L": {"0": ["4"], "1": ["4"], "2": ["4", "5"]},
	"J": {"0": ["5"], "1": ["5"], "2": ["4", "5"]},
	"T": {"0": ["5"], "1": ["4", "5"], "2": ["5"]}
}

var stat_pieces_placed = 0;
var stat_lines_cleared = 0;
var stat_max_height = 0;

var next_piece_0_element = document.getElementById("next_piece_0");
var next_piece_1_element = document.getElementById("next_piece_1");
var next_piece_2_element = document.getElementById("next_piece_2");
var next_piece_3_element = document.getElementById("next_piece_3");
var next_piece_4_element = document.getElementById("next_piece_4");
var next_piece_5_element = document.getElementById("next_piece_5");
var next_piece_6_element = document.getElementById("next_piece_6");

var game_interval;
var piece_spawned = false;
var spawned_piece_type = "";
var spawned_piece_rotation = 0;

var timer_long = -1;
// #endregion



// --------------------------- FUNCTIONS ---------------------------
// #region
function generateRandomPieces() { // Generating up to 7 pieces in advance

	var _pieces = pieces.slice();
	var last_piece_0 = next_pieces[next_pieces.length - 2];
	var last_piece_1 = next_pieces[next_pieces.length - 1];
	for (i = 0; i < 7; i++) {

		// First two new pieces shall not match last two old pieces
		if (i == 0 || i == 1) {
			while (true) {
				var new_piece_index = Math.floor(Math.random() * _pieces.length);
				var new_piece = _pieces[new_piece_index];
				if (new_piece != last_piece_0 && new_piece != last_piece_1) {
					_pieces.splice(new_piece_index, 1);
					next_pieces.push(new_piece);
					break;
				}
			}
		} else {
			var new_piece_index = Math.floor(Math.random() * _pieces.length);
			var new_piece = _pieces[new_piece_index];
			_pieces.splice(new_piece_index, 1);
			next_pieces.push(new_piece);
		}
	}
}

function updatePieceDisplay() { // Update next pieces display, also request piece generation
	if (next_pieces.length <= 7) generateRandomPieces();
	next_piece_0_element.innerText = next_pieces[0];
	next_piece_1_element.innerText = next_pieces[1];
	next_piece_2_element.innerText = next_pieces[2];
	next_piece_3_element.innerText = next_pieces[3];
	next_piece_4_element.innerText = next_pieces[4];
	next_piece_5_element.innerText = next_pieces[5];
	next_piece_6_element.innerText = next_pieces[6];
}

function refreshTableRowElementClasses() { // Updating all table-row elements numerically
	var all_rows = document.querySelectorAll("tr");
	var num_rows = Object.keys(playing_field).length - 1;

	for (const [i, element] of Object.entries(all_rows)) {
		var new_number = num_rows - i;
		element.classList.replace(element.className, `row_${new_number}`);
	}
}

function checkFullSolidRow() { // Checking if a full solid row exists
}

function isOutOfBounds(cell_0, cell_1, cell_2, cell_3) { // Checking if the target cells are out of bounds

	// Sanitizing a bit
	var _cell_0 = cell_0 || [0, 0];
	var _cell_1 = cell_1 || [0, 0];
	var _cell_2 = cell_2 || [0, 0];
	var _cell_3 = cell_3 || [0, 0];

	// Get max allowed row and min/max requested rows and columns
	var max_allowed_row = Object.keys(playing_field).length - 1;
	var max_row = Math.max(_cell_0[0], _cell_1[0], _cell_2[0], _cell_3[0]);
	var min_row = Math.min(_cell_0[0], _cell_1[0], _cell_2[0], _cell_3[0]);
	var max_col = Math.max(_cell_0[1], _cell_1[1], _cell_2[1], _cell_3[1]);
	var min_col = Math.min(_cell_0[1], _cell_1[1], _cell_2[1], _cell_3[1]);

	// Checking if out of bounds
	var out_of_bounds = false;
	if (max_row > max_allowed_row || min_row < 0 || max_col > 9 || min_col < 0) out_of_bounds = true;

	return out_of_bounds;
}

function getControlledCells() { // Returning all currently controlled cells
	var retval_0, retval_1, retval_2, retval_3;
	var num_rows = Object.keys(playing_field).length - 1;
	for (row = num_rows; row >= 0; row--) {
		for (const [col, status] of Object.entries(playing_field[String(row)])) {
			if (status === "controlled") {
				if (retval_0 === undefined) {
					retval_0 = [row, Number(col)];
				} else if (retval_1 === undefined) {
					retval_1 = [row, Number(col)];
				} else if (retval_2 === undefined) {
					retval_2 = [row, Number(col)];
				} else if (retval_3 === undefined) {
					retval_3 = [row, Number(col)];
				}
			}
			if (retval_3 !== undefined) break;
		}
		if (retval_3 !== undefined) break;
	}
	return [retval_0, retval_1, retval_2, retval_3];
}

function attemptMovePiece(dir) { // Moving a piece or solidifying if unable to go down

	// Get all source cells
	var [src_cell_0, src_cell_1, src_cell_2, src_cell_3] = getControlledCells();

	// Get target cells, check out of bounds, solidify if out of bounds when going down
	var tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3;
	var solidify = false;
	if (dir === "left") {
		tgt_cell_0 = [src_cell_0[0], src_cell_0[1] - 1];
		tgt_cell_1 = [src_cell_1[0], src_cell_1[1] - 1];
		tgt_cell_2 = [src_cell_2[0], src_cell_2[1] - 1];
		tgt_cell_3 = [src_cell_3[0], src_cell_3[1] - 1];

		if (isOutOfBounds(tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3) === true) return;
	} else if (dir === "right") {
		tgt_cell_0 = [src_cell_0[0], src_cell_0[1] + 1];
		tgt_cell_1 = [src_cell_1[0], src_cell_1[1] + 1];
		tgt_cell_2 = [src_cell_2[0], src_cell_2[1] + 1];
		tgt_cell_3 = [src_cell_3[0], src_cell_3[1] + 1];

		if (isOutOfBounds(tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3) === true) return;
	} else if (dir === "down") {
		tgt_cell_0 = [src_cell_0[0] - 1, src_cell_0[1]];
		tgt_cell_1 = [src_cell_1[0] - 1, src_cell_1[1]];
		tgt_cell_2 = [src_cell_2[0] - 1, src_cell_2[1]];
		tgt_cell_3 = [src_cell_3[0] - 1, src_cell_3[1]];

		if (isOutOfBounds(tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3) === true) solidify = true;
	}

	// Abort if one of the target cells is solid
	if (!solidify) {
		if (
			playing_field[String(tgt_cell_0[0])][String(tgt_cell_0[1])] === "solid" ||
			playing_field[String(tgt_cell_1[0])][String(tgt_cell_1[1])] === "solid" ||
			playing_field[String(tgt_cell_2[0])][String(tgt_cell_2[1])] === "solid" ||
			playing_field[String(tgt_cell_3[0])][String(tgt_cell_3[1])] === "solid"
		) {
			if (dir === "down") {
				solidify = true;
			} else {
				return;
			}
		}
	}

	// Solidify shape if required
	if (solidify) {
		playing_field[String(src_cell_0[0])][String(src_cell_0[1])] = "solid";
		playing_field[String(src_cell_1[0])][String(src_cell_1[1])] = "solid";
		playing_field[String(src_cell_2[0])][String(src_cell_2[1])] = "solid";
		playing_field[String(src_cell_3[0])][String(src_cell_3[1])] = "solid";
		var _cell_0 = document.querySelector(`.row_${src_cell_0[0]} > .col_${src_cell_0[1]}`);
		var _cell_1 = document.querySelector(`.row_${src_cell_1[0]} > .col_${src_cell_1[1]}`);
		var _cell_2 = document.querySelector(`.row_${src_cell_2[0]} > .col_${src_cell_2[1]}`);
		var _cell_3 = document.querySelector(`.row_${src_cell_3[0]} > .col_${src_cell_3[1]}`);
		_cell_0.classList.remove("controlled");
		_cell_1.classList.remove("controlled");
		_cell_2.classList.remove("controlled");
		_cell_3.classList.remove("controlled");
		_cell_0.classList.add("solid");
		_cell_1.classList.add("solid");
		_cell_2.classList.add("solid");
		_cell_3.classList.add("solid");
		piece_spawned = false;

		stat_pieces_placed++;
		document.getElementById("stat_pieces_placed").innerText = stat_pieces_placed;
		return;
	}

	// Updating targets if required
	if (playing_field[String(tgt_cell_0[0])][String(tgt_cell_0[1])] !== "controlled") { // Target 0
		playing_field[String(tgt_cell_0[0])][String(tgt_cell_0[1])] = "controlled";
		document.querySelector(`.row_${tgt_cell_0[0]} > .col_${tgt_cell_0[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
	}
	if (playing_field[String(tgt_cell_1[0])][String(tgt_cell_1[1])] !== "controlled") { // Target 1
		playing_field[String(tgt_cell_1[0])][String(tgt_cell_1[1])] = "controlled";
		document.querySelector(`.row_${tgt_cell_1[0]} > .col_${tgt_cell_1[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
	}
	if (playing_field[String(tgt_cell_2[0])][String(tgt_cell_2[1])] !== "controlled") { // Target 2
		playing_field[String(tgt_cell_2[0])][String(tgt_cell_2[1])] = "controlled";
		document.querySelector(`.row_${tgt_cell_2[0]} > .col_${tgt_cell_2[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
	}
	if (playing_field[String(tgt_cell_3[0])][String(tgt_cell_3[1])] !== "controlled") { // Target 3
		playing_field[String(tgt_cell_3[0])][String(tgt_cell_3[1])] = "controlled";
		document.querySelector(`.row_${tgt_cell_3[0]} > .col_${tgt_cell_3[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
	}

	// Resetting sources to free if they weren't targetted
	var src_cell_0_str = `${src_cell_0[0]}_${src_cell_0[1]}`;
	var src_cell_1_str = `${src_cell_1[0]}_${src_cell_1[1]}`;
	var src_cell_2_str = `${src_cell_2[0]}_${src_cell_2[1]}`;
	var src_cell_3_str = `${src_cell_3[0]}_${src_cell_3[1]}`;
	var tgt_cell_0_str = `${tgt_cell_0[0]}_${tgt_cell_0[1]}`;
	var tgt_cell_1_str = `${tgt_cell_1[0]}_${tgt_cell_1[1]}`;
	var tgt_cell_2_str = `${tgt_cell_2[0]}_${tgt_cell_2[1]}`;
	var tgt_cell_3_str = `${tgt_cell_3[0]}_${tgt_cell_3[1]}`;
	if (src_cell_0_str !== tgt_cell_0_str && src_cell_0_str !== tgt_cell_1_str && src_cell_0_str !== tgt_cell_2_str && src_cell_0_str !== tgt_cell_3_str) {
		playing_field[String(src_cell_0[0])][String(src_cell_0[1])] = "free";
		document.querySelector(`.row_${src_cell_0[0]} > .col_${src_cell_0[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
	}
	if (src_cell_1_str !== tgt_cell_0_str && src_cell_1_str !== tgt_cell_1_str && src_cell_1_str !== tgt_cell_2_str && src_cell_1_str !== tgt_cell_3_str) {
		playing_field[String(src_cell_1[0])][String(src_cell_1[1])] = "free";
		document.querySelector(`.row_${src_cell_1[0]} > .col_${src_cell_1[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
	}
	if (src_cell_2_str !== tgt_cell_0_str && src_cell_2_str !== tgt_cell_1_str && src_cell_2_str !== tgt_cell_2_str && src_cell_2_str !== tgt_cell_3_str) {
		playing_field[String(src_cell_2[0])][String(src_cell_2[1])] = "free";
		document.querySelector(`.row_${src_cell_2[0]} > .col_${src_cell_2[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
	}
	if (src_cell_3_str !== tgt_cell_0_str && src_cell_3_str !== tgt_cell_1_str && src_cell_3_str !== tgt_cell_2_str && src_cell_3_str !== tgt_cell_3_str) {
		playing_field[String(src_cell_3[0])][String(src_cell_3[1])] = "free";
		document.querySelector(`.row_${src_cell_3[0]} > .col_${src_cell_3[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
	}

	// DEBUG: Draw numbers
	// document.getElementById(`${src_cell_0[0]}_${src_cell_0[1]}`).innerText = "";
	// document.getElementById(`${src_cell_1[0]}_${src_cell_1[1]}`).innerText = "";
	// document.getElementById(`${src_cell_2[0]}_${src_cell_2[1]}`).innerText = "";
	// document.getElementById(`${src_cell_3[0]}_${src_cell_3[1]}`).innerText = "";
	// document.getElementById(`${tgt_cell_0[0]}_${tgt_cell_0[1]}`).innerText = "0";
	// document.getElementById(`${tgt_cell_1[0]}_${tgt_cell_1[1]}`).innerText = "1";
	// document.getElementById(`${tgt_cell_2[0]}_${tgt_cell_2[1]}`).innerText = "2";
	// document.getElementById(`${tgt_cell_3[0]}_${tgt_cell_3[1]}`).innerText = "3";
}
// #endregion



// --------------------------- EVENT LISTENERS ---------------------------
// #region
window.addEventListener("DOMContentLoaded", () => {

	// Generate pieces (two times due to being generated in batches of 7)
	generateRandomPieces();
	generateRandomPieces();

	// Updating the display of pieces
	updatePieceDisplay();

	// Generate playing field
	var code = "";
	for (i = 0; i < 20; i++) {
		code = `
			<tr class="row_${i}">
				<td class="col_0"></td>
				<td class="col_1"></td>
				<td class="col_2"></td>
				<td class="col_3"></td>
				<td class="col_4"></td>
				<td class="col_5"></td>
				<td class="col_6"></td>
				<td class="col_7"></td>
				<td class="col_8"></td>
				<td class="col_9"></td>
			</tr>
			${code}
		`;
		playing_field[String(i)] = {"0": "free", "1": "free", "2": "free", "3": "free", "4": "free", "5": "free", "6": "free", "7": "free", "8": "free", "9": "free"};
	}
	document.getElementById("game_container").innerHTML = `<table><tbody>${code}</tbody></table>`;

	// Start the game
	game_interval = setInterval(function() {

		// Timers for running on specific loops only
		timer_long++;
		if (timer_long >= 100) timer_long = 0;

		// Runs when no piece is spawned and long timer was just reset
		if (!piece_spawned && timer_long === 0) {

			// Check for and delete solid rows
			var num_deleted_rows = 0;
			var num_total_rows = Object.keys(playing_field).length - 1;
			for (const [row, v] of Object.entries(playing_field)) {

				// Check if current row is completely solid
				var current_row_solid = true;
				for (const [col, status] of Object.entries(v)) {
					if (status !== "solid") {
						current_row_solid = false;
						break;
					}
				}

				// If the current row is solid, delete it, update playing field and elements
				if (current_row_solid) {
					num_deleted_rows++;

					// Delete the row element
					document.querySelector(`.row_${row}`).remove();

					// Grab the info from x rows above and save it in the current one
					playing_field[row] = playing_field[String(Number(row) + num_deleted_rows)]; // eg. row 2 gets info from row 3

					// Update on screen stats
					stat_lines_cleared++;
					document.getElementById("stat_lines_cleared").innerText = stat_lines_cleared;
				}
			}

			// Once done iterating the entire playing_field object, delete x rows from the top
			for (i = num_total_rows; i > num_total_rows - num_deleted_rows; i--) delete playing_field[String(i)];

			// Refresh all displayed <tr> elements' classes
			refreshTableRowElementClasses();

			// DEBUG
			// console.log(playing_field);

			// Remove next piece from pieces list and update the display
			spawned_piece_type = next_pieces.splice(0, 1);
			updatePieceDisplay(); // Also generates batch of new pieces if necessary

			// Repeatedly check if we have enough free cells
			while (!piece_spawned) {
				var top_row = Object.keys(playing_field).length - 1;
				var created_new_line = false;
				for (const [row, v] of Object.entries(spawning_requirements[spawned_piece_type])) {
					for (const col of v) {

						// If the cell isn't free, create a new row
						if (playing_field[String(top_row - Number(row))][col] !== "free") {

							// Creating a new entry in the playing field object
							playing_field[String(top_row + 1)] = {"0": "free", "1": "free", "2": "free", "3": "free", "4": "free", "5": "free", "6": "free", "7": "free", "8": "free", "9": "free"};

							// Creating a new row in the table
							var new_row = document.createElement("tr");
							new_row.innerHTML = `
								<td id="${top_row + 1}_0" class="free"></td>
								<td id="${top_row + 1}_1" class="free"></td>
								<td id="${top_row + 1}_2" class="free"></td>
								<td id="${top_row + 1}_3" class="free"></td>
								<td id="${top_row + 1}_4" class="free"></td>
								<td id="${top_row + 1}_5" class="free"></td>
								<td id="${top_row + 1}_6" class="free"></td>
								<td id="${top_row + 1}_7" class="free"></td>
								<td id="${top_row + 1}_8" class="free"></td>
								<td id="${top_row + 1}_9" class="free"></td>
							`;
							document.querySelector("tbody").prepend(new_row);

							// Adjust width in CSS
							document.getElementById("game_container").setAttribute("style", `width: calc((100vh - (2 * 8px)) * (10 / (${top_row} + 1)));`);

							// Prevent from exiting while loop
							created_new_line = true;
							break;
						}
					}
					// New line was created, break out of this iteration
					if (created_new_line) break;
				}

				// No new lines created, piece can now be spawned
				if (!created_new_line) {

					// Iterate rows, then columns that need to be spawned
					for (const [row, v] of Object.entries(spawning_requirements[spawned_piece_type])) {
						for (const col of v) {
							var target_row = top_row - Number(row);

							// Switching status in object
							playing_field[String(target_row)][col] = "controlled";

							// CSS classes
							var target_cell = document.querySelector(`.row_${target_row} > .col_${col}`);
							if (target_cell === undefined) {
								clearInterval(game_interval);
								return;
							}
							target_cell.classList.add("controlled", `piece_${spawned_piece_type}`);
						}
					}
					piece_spawned = true;
				}
			}
			spawned_piece_rotation = 0;
			return; // Prevent moving right after spawn
		}

		// Move piece down logic
		if (piece_spawned && timer_long === 0) attemptMovePiece("down");
	}, 10);
});

window.addEventListener("keydown", (event) => {
	if (piece_spawned) {
		if (event.code === "ArrowLeft") {
			attemptMovePiece("left");
		} else if (event.code === "ArrowRight") {
			attemptMovePiece("right");
		} else if (event.code === "ArrowUp") {

			// Get currently controlled cells and create target cell variables
			var [src_cell_0, src_cell_1, src_cell_2, src_cell_3] = getControlledCells();
			var tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3;

			// Calculate targets depending on each piece
			if (spawned_piece_type == "O") {
				return;
			} else if (spawned_piece_type == "I") {
				if (spawned_piece_rotation === 0 || spawned_piece_rotation === 2) { // 0° -> 90° || 180° -> 270°
					tgt_cell_0 = [src_cell_0[0] + 2, src_cell_0[1] + 2];
					tgt_cell_1 = [src_cell_1[0] + 1, src_cell_1[1] + 1];
					tgt_cell_3 = [src_cell_3[0] - 1, src_cell_3[1] - 1];
				} else if (spawned_piece_rotation === 1 || spawned_piece_rotation === 3) { // 90° -> 180° || 270° -> 0°
					tgt_cell_0 = [src_cell_0[0] - 2, src_cell_0[1] - 2];
					tgt_cell_1 = [src_cell_1[0] - 1, src_cell_1[1] - 1];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 1];
				}
			} else if (spawned_piece_type == "S") {
				if (spawned_piece_rotation === 0 || spawned_piece_rotation === 2) { // 0° -> 90° || 180° -> 270°
					tgt_cell_0 = [src_cell_0[0], src_cell_0[1] + 2];
					tgt_cell_3 = [src_cell_3[0] + 2, src_cell_3[1]];
				} else if (spawned_piece_rotation === 1 || spawned_piece_rotation === 3) { // 90° -> 180° || 270° -> 0°
					tgt_cell_0 = [src_cell_0[0], src_cell_0[1] - 1];
					tgt_cell_1 = [src_cell_1[0] - 2, src_cell_1[1] - 1];
				}
			} else if (spawned_piece_type == "Z") {
				if (spawned_piece_rotation === 0 || spawned_piece_rotation === 2) { // 0° -> 90° || 180° -> 270°
					tgt_cell_1 = [src_cell_1[0] + 1, src_cell_1[1]];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 2];
				} else if (spawned_piece_rotation === 1 || spawned_piece_rotation === 3) { // 90° -> 180° || 270° -> 0°
					tgt_cell_0 = [src_cell_0[0] - 1, src_cell_0[1]];
					tgt_cell_3 = [src_cell_3[0] - 1, src_cell_3[1] - 2];
				}
			} else if (spawned_piece_type == "L") {
				if (spawned_piece_rotation === 0) { // 0° -> 90°
					tgt_cell_0 = [src_cell_0[0] - 1, src_cell_0[1] + 1];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 1];
				} else if (spawned_piece_rotation === 1) { // 90° -> 180°
					tgt_cell_0 = [src_cell_0[0] + 1, src_cell_0[1]];
					tgt_cell_2 = [src_cell_2[0] + 1, src_cell_2[1] - 1];
					tgt_cell_3 = [src_cell_3[0], src_cell_3[1] + 1];
				} else if (spawned_piece_rotation === 2) { // 180° -> 270°
					tgt_cell_0 = [src_cell_0[0] - 1, src_cell_0[1] + 2];
					tgt_cell_1 = [src_cell_1[0] - 2, src_cell_1[1] + 1];
					tgt_cell_2 = [src_cell_2[0] - 1, src_cell_2[1] - 1];
				} else if (spawned_piece_rotation === 3) { // 270° -> 0°
					tgt_cell_0 = [src_cell_0[0] + 1, src_cell_0[1] - 2];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] - 2];
				}
			} else if (spawned_piece_type == "J") {
				if (spawned_piece_rotation === 0) { // 0° -> 90°
					tgt_cell_0 = [src_cell_0[0], src_cell_0[1] - 1];
					tgt_cell_2 = [src_cell_2[0] + 1, src_cell_2[1]];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 1];
				} else if (spawned_piece_rotation === 1) { // 90° -> 180°
					tgt_cell_2 = [src_cell_2[0] + 1, src_cell_2[1]];
					tgt_cell_3 = [src_cell_3[0] - 1, src_cell_3[1] - 2];
				} else if (spawned_piece_rotation === 2) { // 180° -> 270°
					tgt_cell_2 = [src_cell_2[0] + 1, src_cell_2[1] + 2];
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 2];
				} else if (spawned_piece_rotation === 3) { // 270° -> 0°
					tgt_cell_0 = [src_cell_0[0] - 2, src_cell_0[1]];
					tgt_cell_2 = [src_cell_2[0] - 2, src_cell_2[1] - 1];
					tgt_cell_3 = [src_cell_3[0], src_cell_3[1] - 1];
				}
			} else if (spawned_piece_type == "T") {
				if (spawned_piece_rotation === 0) { // 0° -> 90°
					tgt_cell_3 = [src_cell_3[0] + 1, src_cell_3[1] + 1];
				} else if (spawned_piece_rotation === 1) { // 90° -> 180°
					tgt_cell_1 = [src_cell_1[0] - 1, src_cell_1[1] + 1];
				} else if (spawned_piece_rotation === 2) { // 180° -> 270°
					tgt_cell_0 = [src_cell_0[0] - 1, src_cell_0[1] - 1];
				} else if (spawned_piece_rotation === 3) { // 270° -> 0°
					tgt_cell_2 = [src_cell_2[0] + 1, src_cell_2[1] - 1];
				}
			}

			// Check if target out of bounds
			if (isOutOfBounds(tgt_cell_0, tgt_cell_1, tgt_cell_2, tgt_cell_3)) return;

			// Check if target cells are solid
			var abort = false;
			if (tgt_cell_0 != undefined) if (playing_field[String(tgt_cell_0[0])][String(tgt_cell_0[1])] === "solid") abort = true;
			if (tgt_cell_1 != undefined) if (playing_field[String(tgt_cell_1[0])][String(tgt_cell_1[1])] === "solid") abort = true;
			if (tgt_cell_2 != undefined) if (playing_field[String(tgt_cell_2[0])][String(tgt_cell_2[1])] === "solid") abort = true;
			if (tgt_cell_3 != undefined) if (playing_field[String(tgt_cell_3[0])][String(tgt_cell_3[1])] === "solid") abort = true;
			if (abort) return;

			// Rotating here
			if (tgt_cell_0 != undefined) {
				playing_field[String(src_cell_0[0])][String(src_cell_0[1])] = "free";
				document.querySelector(`.row_${src_cell_0[0]} > .col_${src_cell_0[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
				playing_field[String(tgt_cell_0[0])][String(tgt_cell_0[1])] = "controlled";
				document.querySelector(`.row_${tgt_cell_0[0]} > .col_${tgt_cell_0[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
			}
			if (tgt_cell_1 != undefined) {
				playing_field[String(src_cell_1[0])][String(src_cell_1[1])] = "free";
				document.querySelector(`.row_${src_cell_1[0]} > .col_${src_cell_1[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
				playing_field[String(tgt_cell_1[0])][String(tgt_cell_1[1])] = "controlled";
				document.querySelector(`.row_${tgt_cell_1[0]} > .col_${tgt_cell_1[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
			}
			if (tgt_cell_2 != undefined) {
				playing_field[String(src_cell_2[0])][String(src_cell_2[1])] = "free";
				document.querySelector(`.row_${src_cell_2[0]} > .col_${src_cell_2[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
				playing_field[String(tgt_cell_2[0])][String(tgt_cell_2[1])] = "controlled";
				document.querySelector(`.row_${tgt_cell_2[0]} > .col_${tgt_cell_2[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
			}
			if (tgt_cell_3 != undefined) {
				playing_field[String(src_cell_3[0])][String(src_cell_3[1])] = "free";
				document.querySelector(`.row_${src_cell_3[0]} > .col_${src_cell_3[1]}`).classList.remove("controlled", `piece_${spawned_piece_type}`);
				playing_field[String(tgt_cell_3[0])][String(tgt_cell_3[1])] = "controlled";
				document.querySelector(`.row_${tgt_cell_3[0]} > .col_${tgt_cell_3[1]}`).classList.add("controlled", `piece_${spawned_piece_type}`);
			}

			// Updating rotation
			spawned_piece_rotation++;
			if (spawned_piece_rotation >= 4) spawned_piece_rotation = 0;

			// DEBUG: Draw numbers
			// document.getElementById(`${src_cell_0[0]}_${src_cell_0[1]}`).innerText = "";
			// document.getElementById(`${src_cell_1[0]}_${src_cell_1[1]}`).innerText = "";
			// document.getElementById(`${src_cell_2[0]}_${src_cell_2[1]}`).innerText = "";
			// document.getElementById(`${src_cell_3[0]}_${src_cell_3[1]}`).innerText = "";
			// document.getElementById(`${tgt_cell_0[0]}_${tgt_cell_0[1]}`).innerText = "0";
			// document.getElementById(`${tgt_cell_1[0]}_${tgt_cell_1[1]}`).innerText = "1";
			// document.getElementById(`${tgt_cell_2[0]}_${tgt_cell_2[1]}`).innerText = "2";
			// document.getElementById(`${tgt_cell_3[0]}_${tgt_cell_3[1]}`).innerText = "3";
		} else if (event.code === "ArrowDown") {
			attemptMovePiece("down");
			timer_long = 1;
		}
	// This would be for arrow down to trigger a new piece instantly spawning,
	// but it feels kind of weird while holding the button down.
	// It might need a small cooldown for the user to allow releasing the button
	// on time, otherwise it'd just spam the next piece already.
	// } else {
	// 	if (event.code === "ArrowDown") timer_long = -1;
	}
});
// #endregion