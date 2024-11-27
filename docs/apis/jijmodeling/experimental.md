## <span class="class-func-prefix">class</span> <span class="class-func-name">Sample</span>

A Sample representing an individual solution found by running the mathematical optimization model.

Variables in `var_values` are stored in instances of `SparseVarValues`. This uses a dictionary
style, retaining only non-zero elements. For example, if the values for a two-dimensional
decision variable are `x = [[0, 1, 2], [1, 0, 0]]`, they will be stored as
`{(0,1): 1, (0,2): 2, (1,0): 1}`. To retrieve this, use `sample.var_values["x"].values`.
If you want a dense array of decision variables, you can use the `to_dense()` method.

`run_id` is a unique identifier of the run in which this sample was found.
Note that this is not the same as a unique identifier of the Sample.



