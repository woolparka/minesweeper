import React from 'react';
import PropTypes from 'prop-types';

import Cell from './GameCells'

export default class GameBoard extends React.Component {
  state = {
    board_data: this.initialize_board_data(this.props.width, this.props.height, this.props.bombs),
    status: "Flag all the mines!",
    nbombs: this.props.bombs,
  };

  initialize_matrix(width, height) {
    // Create an initial board data with a matrix format [[],[]]
    let board = [];
    for (let i = 0; i < height; i++) {
      board.push(Array.apply(null, Array(width)).map(Number.prototype.valueOf,0))
    }
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        board[r][c] = {
          r: r,
          c: c,
          is_bomb: false,
          number: 0,
          revealed: false,
          flagged: false,
          empty: true
        };
      }
    }
    return board;
  }

  getRandomInt(max) {
    // Simple random int function from range 0 - max (not inclusive)
    return Math.floor(Math.random() * Math.floor(max));
  }

  initialize_random_bombs(data, bombs) {
    // take initialized board data and pick n bombs randomly
    const height = data.length;
    const width = data[0].length;
    let random_r, random_c, bombs_placed = 0;
    // random placement without replacement. set loop wont do
    while (bombs_placed < bombs) {

      random_r = this.getRandomInt(height);
      random_c = this.getRandomInt(width);

      if (!data[random_r][random_c].is_bomb) {
        data[random_r][random_c].is_bomb = true;
        bombs_placed += 1;
      }
    }
    return data;
  }

  check_bomb(datapoint) {
    // checks if the cell is a bomb cell and returns 1 if bomb
    if (datapoint.is_bomb) {
      return 1;
    } else {
      return 0;
    }
  }

  get_kernel(data, r, c) {
    const flat_kernel = [];
    // could do padding by 1 on all sides, or do condtional look up on all sides
    // since conditionals are easier ill just do conditionals
    const height = this.props.height;
    const width = this.props.width;
    // row above
    if (r > 0 && c > 0) {
      flat_kernel.push(this.check_bomb(data[r - 1][c - 1]));
    }
    if (r > 0) {
      flat_kernel.push(this.check_bomb(data[r - 1][c]));
    }
    if (r > 0 && c < width - 1) {
      flat_kernel.push(this.check_bomb(data[r - 1][c + 1]));
    }
    // current row
    if (c > 0) {
      flat_kernel.push(this.check_bomb(data[r][c - 1]));
    }
    if (c < width - 1) {
      flat_kernel.push(this.check_bomb(data[r][c + 1]));
    }
    // row below
    if (r < height - 1 && c > 0) {
      flat_kernel.push(this.check_bomb(data[r + 1][c - 1]));
    }
    if (r < height - 1) {
      flat_kernel.push(this.check_bomb(data[r + 1][c]));
    }
    if (r < height - 1 && c < width - 1) {
      flat_kernel.push(this.check_bomb(data[r + 1][c + 1]));
    }
    return flat_kernel
  }

  calculate_cell_numbers(data) {
    // get all instances of mines on all neighboring cells (3x3 kernel)
    // and add up the number of mines in that kernel.
    const height = this.props.height
    const width = this.props.width;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const kernel = this.get_kernel(data, r, c);
        const n_bombs = kernel.reduce((a,b) => a + b);
        data[r][c].number = n_bombs;
        if (n_bombs !== 0) {
          data[r][c].empty = false;
        }
      }
    }
    return data;
  }

  initialize_board_data(width, height, bombs) {
    // fill board data with randomized bombs and corresponding cell numbers
    let data = this.initialize_matrix(width, height);
    data = this.initialize_random_bombs(data, bombs);
    data = this.calculate_cell_numbers(data);
    return data;
  }

  show_board() {
    // flip all the cells and show the board.
    let copy_data = this.state.board_data;
    const height = copy_data.length;
    const width = copy_data[0].length;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        copy_data[r][c].revealed = true;
      }
    }
    this.setState({board_data: copy_data})
  }

  peek_surrounding(data, r, c) {
    // Refactor the kernel function so that we can reduce redundancy.
    const surrounding = [];
    // could do padding by 1 on all sides, or do condtional look up on all sides
    // since conditionals are easier ill just do conditionals
    const height = this.props.height;
    const width = this.props.width;
    // row above
    if (r > 0 && c > 0) {
      surrounding.push(data[r - 1][c - 1]);
    }
    if (r > 0) {
      surrounding.push(data[r - 1][c]);
    }
    if (r > 0 && c < width - 1) {
      surrounding.push(data[r - 1][c + 1]);
    }
    // current row
    if (c > 0) {
      surrounding.push(data[r][c - 1]);
    }
    if (c < width - 1) {
      surrounding.push(data[r][c + 1]);
    }
    // row below
    if (r < height - 1 && c > 0) {
      surrounding.push(data[r + 1][c - 1]);
    }
    if (r < height - 1) {
      surrounding.push(data[r + 1][c]);
    }
    if (r < height - 1 && c < width - 1) {
      surrounding.push(data[r + 1][c + 1]);
    }
    return surrounding;
  }

  recursively_open_empty(data, r, c) {
    let initial_surrounding = this.peek_surrounding(data, r, c);
    initial_surrounding.map(datapoint => {
      if (!datapoint.flagged && !datapoint.revealed && (datapoint.empty || !datapoint.is_bomb)) {
        data[datapoint.r][datapoint.c].revealed = true;
        if (datapoint.empty) {
          this.recursively_open_empty(data, datapoint.r, datapoint.c);
        }
      }
    });
    return data;
  }

  get_unopened_cells(data) {
    const unopened_cells = []
    data.map(row => {
      row.map(dp => {
        if (!dp.revealed) {
          unopened_cells.push(dp);
        }
      });
    });
    return unopened_cells;
  }

  get_flagged_cells(data) {
    const flagged_cells = []
    data.map(row => {
      row.map(dp => {
        if (dp.flagged) {
          flagged_cells.push(dp);
        }
      });
    });
    return flagged_cells;
  }

  get_bomb_cells(data) {
    const bomb_cells = []
    data.map(row => {
      row.map(dp => {
        if (dp.is_bomb) {
          bomb_cells.push(dp);
        }
      });
    });
    return bomb_cells;
  }

  cell_clicked(r, c) {
    // On click invoked function should flip cell to revealed cell.
    // there is a win condition here when you open all cells without mines
    // also a loss condition when you click on a bomb
    console.log("clicked")
    if (this.state.board_data[r][c].is_bomb) {
      this.show_board()
      this.setState({status: "You clicked on a bomb."});
      alert("Game Over. You clicked on a bomb. Refresh to Restart.")
      return null;
    }

    // You can't click on items you've flagged or already revealed.
    if (this.state.board_data[r][c].revealed || this.state.board_data[r][c].flagged) {
      return null;
    }

    // since we want react to rerender we need a copy of the data and update that
    let deepcopy_gamedata = this.state.board_data;
    deepcopy_gamedata[r][c].revealed = true;
    deepcopy_gamedata[r][c].flagged = false;

    // opening an empty cell should trigger opening of other nearby cells.
    // for this we need the cascade to happen. where it looks up and reveals
    // if the surrounding cells are empty.
    // I implemented the look in all directions for a bomb logic earlier on.
    // this can be refactored, but for this I'm just going to make another function
    if (deepcopy_gamedata[r][c].empty) {
      deepcopy_gamedata = this.recursively_open_empty(deepcopy_gamedata, r, c);
    }

    // if the amount of cells left after you filp the tile is equal to the
    // number of bombs in the game, you win.
    if (this.get_unopened_cells(deepcopy_gamedata).length === this.props.bombs) {
      this.setState({status: "You won!"});
      this.show_board();
      alert("You Won!");
    }

    this.setState({
      board_data: deepcopy_gamedata,
      nbombs: this.props.bombs - this.get_flagged_cells(deepcopy_gamedata).length,
    })
  }

  cell_flagged(r, c) {
    // there is a win condition here when you correctly flag all the bombs
    // this condition is a bit more tricky since the cells that are flagged and the cells that
    // are with bombs have to be exactly the same.
    // also we want this to trigger once we flag the last bomb so this needs to happen before
    // we update the state. we can do this with an internal bomb counter.
    console.log("flagged")
    if (this.state.board_data[r][c].revealed) {
      return null;
    }
    let deepcopy_gamedata = this.state.board_data;
    let bombs = this.state.nbombs;

    if (deepcopy_gamedata[r][c].flagged) {
      deepcopy_gamedata[r][c].flagged = false;
      bombs += 1;
    } else {
      deepcopy_gamedata[r][c].flagged = true;
      bombs -= 1;
    }

    if (bombs === 0) {
      const bomb_cells = this.get_bomb_cells(deepcopy_gamedata);
      const flagged_cells = this.get_flagged_cells(deepcopy_gamedata);
      // order of these two cells shouldnt matter since the traversal records in the same sequence
      if (JSON.stringify(bomb_cells) === JSON.stringify(flagged_cells) ) {
        this.setState({status: "You won!"});
        this.show_board();
        alert("You Won!");
      }
    }

    this.setState({
      board_data: deepcopy_gamedata,
      nbombs: bombs,
    });

  }

  render_game(data) {
    return data.map((datarow) => {
      return datarow.map((datapoint) => {
        return (
          <div key={datapoint.r * datarow.length + datapoint.c}>
            <Cell
              onClick={() => this.cell_clicked(datapoint.r, datapoint.c)}
              onContextMenu={() => this.cell_flagged(datapoint.r, datapoint.c)}
              value={datapoint}
            />
            {(datarow[datarow.length - 1] === datapoint) ? <div className="clear" /> : ""}
          </div>);
      })
    });
  }

  render() {
    return (
      <div className="gameboard">
        <div className="gameinfo">
          <span className="gamestatus">
            {this.state.status}
          </span>
        </div>
        {this.render_game(this.state.board_data)}
      </div>
    )
  };
}

GameBoard.propTypes = {
  bombs: PropTypes.number,
  height: PropTypes.number,
  width: PropTypes.number,
}