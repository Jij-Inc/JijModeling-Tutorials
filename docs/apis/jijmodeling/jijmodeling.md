## <span class="class-func-prefix">class</span> <span class="class-func-name">AbsOp</span>

A class for representing the absolute value

The `AbsOp` class is used to represent the absolute value.
The number of dimensions of the operand is zero.

Attributes
-----------
- `operand`: The operand.

Note
-----
The `AbsOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">AddOp</span>

A class for representing addition

The `AddOp` class is used to represent addition (`+`) of an arbitrary number of operands.
For example `a + b + c + d` would be one `AddOp` object.
The number of dimensions of each operand is zero.

Attributes
-----------
`terms`: A sequence of operands to be added.

Note
-----
The `AddOp` class does not have a constructor. Its intended
instantiation method is by calling the addition operation on other
expressions.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">AndOp</span>

A class for representing logical AND

The `AndOp` class is used to represent logical AND (`&`) of an arbitrary number of operands.
For example `a & b & c & d` would be one `AndOp` object.
The number of dimensions of each operand is zero.

Attributes
-----------
- `terms`: A sequence of operands to apply the AND operation.

Note
-----
The `AndOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ArrayLength</span>

A class for referring to the length of an array at a given axis.

The ArrayLength class is to refer to the number of elements of an axis in an array.

This class is not intended to be constructed directly. Instead, we
recommend using the `len_at` method of `Placeholder`, `Element` or
`Subscript`.

Attributes
-----------
- `array`: A variable with `ndim >= 1`.
- `axis`: An axis index. A $n$-dimensional variable has $n$ axes. Axis 0 is the array's outermost axis and $n-1$ is the innermost.
- `description` (`str`, optional): A description of the ArrayLength instance.

Raises
-------
`ModelingError`: Raises if `axis` >= `array.ndim`.

Examples
---------
Create a length of axis 0 in a 2-dimensional placeholder.

```python
>>> import jijmodeling as jm
>>> a = jm.Placeholder("a", ndim=2)
>>> N = a.len_at(0, latex="N")

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">BinaryVar</span>

A class for creating a binary variable

The BinaryVar class is used to create a binary variable.

The index operator (`[]`) of a binary variable with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the binary variable.
- `shape` (`tuple`): A tuple with the size of each dimension of the binary variable. Empty if the variable is not multi-dimensional.
- `description` (`str`): A description of the binary variable.

Args
-----
- `name` (`str`): A name of the binary variable.
- `shape` (`list | tuple`): A sequence with the size of each dimension of the binary variable. Defaults to an empty tuple (a scalar value).
  - Each item in `shape` must be a valid expression evaluating to a non-negative scalar.
- `latex` (`str`, optional): A LaTeX-name of the binary variable to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the binary variable.

Examples
---------
Create a scalar binary variable whose name is "z".

```python
>>> import jijmodeling as jm
>>> z = jm.BinaryVar("z")

```

Create a 2-dimensional binary variable whose name is "x" and has a 2x2 shape.

```python
>>> import jijmodeling as jm
>>> x = jm.BinaryVar("x", shape=[2, 2])

```

Create a 1-dimensional binary variable with the index of `123`.

```python
>>> import jijmodeling as jm
>>> x = jm.BinaryVar("x", shape=[124])
>>> x[123]
BinaryVar(name='x', shape=[NumberLit(value=124)])[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">CeilOp</span>

A class for representing the ceil operator

The `CeilOp` class is used to represent the ceil operator.
The number of dimensions of the operand is zero.

Attributes
-----------
- `operand`: The operand.

Note
-----
The `CeilOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Constraint</span>

A class for creating a constraint

The Constraint class is used to create a constraint.

Attributes
-----------
- `name` (`str`): A name of the constraint.
- `sense`: equal sign (`=`) or inequality sign (`>=` or `<=`) included in the expression.
- `expression`: The (in)equality equation of the constraint.
- `forall` (`list`): A list that stores forall indices.

Args
-----
- `name` (`str`): A name of the constraint.
- `expression`: The (in)equality equation of the constraint.
- `forall`: A list that stores forall indices. Defaults to None.

Raises
-------
`ModelingError`: Raises if `expression` does not contain any decision variable.

Expression
-----------
Create an equality constraint that the sum of $N$ binary variables is equal to one.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N,))
>>> repr(jm.Constraint("constraint", jm.sum(i, x[i]) == 1))
'Constraint(name="constraint", expression=sum(i in [0..N), x[i]) == 1)'

```

Create an inequality constraint with forall.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> j = jm.Element("j", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N, N))
>>> repr(jm.Constraint("constraint", jm.sum(i, x[i,j]) == 1, forall=j))
'Constraint(name="constraint", expression=sum(i in [0..N), x[i, j]) == 1, forall=[j])'

```

Create an inequality constraint with conditional forall.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> j = jm.Element("j", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N, N))
>>> repr(jm.Constraint("constraint", x[i,j] <= 2, forall=[i, (j, j != i)]))
'Constraint(name="constraint", expression=x[i, j] <= 2, forall=[i, (j, j != i)])'

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ConstraintSense</span>

Equality of a constraint




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ContinuousVar</span>

A class for creating a continuous variable

The ContinuousVar class is used to create a continuous variable.
The lower and upper bounds of the variable can be specified by:
- an integer value
- a float value
- a scalar expression that does not contains any decision variable
- a Placeholder object whose dimensionality is equal to that of this variable.
- a subscripted variable whose dimensionality is equal to that of this variable.

The index operator (`[]`) of a variable with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the continuous variable.
- `shape` (`tuple`): A tuple with the size of each dimension of the integer variable. Empty if the variable is not multi-dimensional.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `description` (`str`): A description of the continuous variable.

Args
-----
- `name` (`str`): A name of the continuous variable.
- `shape` (`list | tuple`): A sequence with the size of each dimension of the continuous variable. Defaults to an empty tuple (a scalar value).
  - Each item in `shape` must be a valid expression evaluating to a non-negative scalar.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `latex` (`str`, optional): A LaTeX-name of the continuous variable to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the continuous variable.

Raises
-------
`ModelingError`: Raises if a bound is a `Placeholder` or `Subscript` object whose `ndim` is neither `0` nor the same value as `ndim` of the continuous variable.

Examples
---------
Create a scalar continuous variable whose name is "z" and domain is `[-1, 1]`.

```python
>>> import jijmodeling as jm
>>> z = jm.ContinuousVar("z", lower_bound=-1, upper_bound=1)

```

Create a 2-dimensional continuous variable...
- whose name is "x".
- whose domain is [0, 2].
- where each dimension has length 2 (making this a 2x2 matrix).

```python
>>> import jijmodeling as jm
>>> x = jm.ContinuousVar("x", shape=[2, 2], lower_bound=0, upper_bound=2)

```

Create a 1-dimensional continuous variable with the index of `123`.

```python
>>> import jijmodeling as jm
>>> x = jm.ContinuousVar("x", shape=[124], lower_bound=0, upper_bound=2)
>>> x[123]
ContinuousVar(name='x', shape=[NumberLit(value=124)], lower_bound=NumberLit(value=0), upper_bound=NumberLit(value=2))[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">CustomPenaltyTerm</span>

A class for creating a custom penalty term

The CustomPenaltyTerm class is used to create a custom penalty term.

Attributes
-----------
- `name` (`str`): A name of the custom penalty term.
- `expression`: The expression of the custom penalty term.
- `forall` (`list`): A list that stores forall indices.

Args
-----
- `name` (`str`): A name of the custom penalty term.
- `expression`: The expression of the custom penalty term.
- `forall`: A list that stores forall indices. Defaults to None.

Raises
-------
`ModelingError`: Raises if `expression` does not contain any decision variable.

Expression
-----------
Create a custom penalty term.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N,))
>>> repr(jm.CustomPenaltyTerm("custom penalty term", (jm.sum(i, x[i]) - 1)**2))  # doctest: +ELLIPSIS
'CustomPenaltyTerm(name="custom penalty term", expression=((sum(i in [0..N), x[i]) - 1) ** 2))'

```

Create a custom penalty term with forall.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> j = jm.Element("j", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N, N))
>>> repr(jm.CustomPenaltyTerm("custom penalty term", (jm.sum(i, x[i,j]) - 1)**2, forall=j))  # doctest: +ELLIPSIS
'CustomPenaltyTerm(name="custom penalty term", expression=((sum(i in [0..N), x[i, j]) - 1) ** 2), forall=[j])'

```

Create a custom penalty term with conditional forall.

```python
>>> import jijmodeling as jm
>>> N = jm.Placeholder("N")
>>> i = jm.Element("i", belong_to=N)
>>> j = jm.Element("j", belong_to=N)
>>> x = jm.BinaryVar("x", shape=(N, N))
>>> repr(jm.CustomPenaltyTerm("custom penalty term", (x[i,j] - 2)**2, forall=[i, (j, j != i)]))  # doctest: +ELLIPSIS
'CustomPenaltyTerm(name="custom penalty term", expression=((x[i, j] - 2) ** 2), forall=[i, (j, j != i)])'

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">DummyIndexedVar</span>

A class for representing a subscripted variable with dummy indices

The `DummyIndexedVar` class is an intermediate representation to support syntactic sugar of sum/prod with slices.

Note
-----
The `DummyIndexedVar` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Element</span>

A class for creating an element

The `Element` class is used to create an element.
It is used in the following cases:
- an index of summation $\displaystyle \sum$ (`SumOp`)
- an index of product $\displaystyle \prod$ (`ProdOp`)
- a bound variable of the universal quantifier $\forall$ (`Forall`)

Elements specify a set to which they belong. The set can be:
1. A half-open range, where the lower bound is included and the upper bound is excluded.
2. A `Placeholder`, `Element`, or `Subscript` object with `ndim >= 1`.

Ranges are generally specified with tuples as `(start, end)`. For
convenience, passing a single number or scalar object as the argument is
interpreted as the `end` of a range starting from zero.

The index operator (`[]`) of an element with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the element.
- `ndim` (`int`): The number of dimensions of the element. The value is one less than the value of `belong_to.ndim`.
- `description` (`str`): A description of the element.
- `belong_to`: A set the element belongs to.

Args
-----
- `name` (`str`): A name of the element.
- `belong_to`: A set the element belongs to.
- `latex` (`str`, optional): A LaTeX-name of the element to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the element.

Examples
---------
Note that `belong_to` is a positional argument, not a keyword
argument, and so does not need to be written out. This is done in some
of these examples for clarity.

Create an element that belongs to a half-open range.

```python
>>> import jijmodeling as jm
>>> i = jm.Element("i", belong_to=(0,10))

```

If you pass a scalar as the `belong_to` argument, the set that the element belongs to is a range starting at 0 going up to that value.

```python
>>> import jijmodeling as jm
>>> i = jm.Element("i", 10)
>>> assert jm.is_same(i, jm.Element("i", belong_to=(0,10)))

```

The applies not just to numbers, but certain scalars, like `Placeholder` (with `ndim == 0`).

```python
>>> import jijmodeling as jm
>>> n = jm.Placeholder("N")
>>> i = jm.Element("i", n)
>>> assert jm.is_same(i, jm.Element("i", belong_to=(0,n)))

```

Create an element that belongs to a 1-dimensional placeholder.

```python
>>> import jijmodeling as jm
>>> E = jm.Placeholder("E", ndim=1)
>>> e = jm.Element("e", E)

```

Create a 1-dimensional element with the index of `123`.

```python
>>> import jijmodeling as jm
>>> a = jm.Placeholder("a", ndim=2)
>>> e = jm.Element("e", a)
>>> e[123]
Element(name='e', belong_to=Placeholder(name='a', ndim=2))[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">EqualOp</span>

A class for representing the equal operator

The `EqualOp` class is used to represent the equal operator (`==`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `EqualOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Evaluation</span>

A class for evaluation.

The Evaluation class is to represent the result of evaluating a model.

### Attributes

- **<span class="var-name">energy(numpy.ndarray)</span>** : The value of energy of each sample.
- **<span class="var-name">objective(numpy.ndarray)</span>** : The value of an objective function of each sample.
- **<span class="var-name">constraint_violations(dict[str, numpy.ndarray])</span>** : The constraint violation of each sample.
- **<span class="var-name">constraint_forall(dict[str, numpy.ndarray])</span>** : The constraint forall of each sample.
- **<span class="var-name">constraint_values(numpy.ndarray)</span>** : The constraint value of each sample.
- **<span class="var-name">penalty(dict[str, numpy.ndarray])</span>** : The penalty of each sample.





---
## <span class="class-func-prefix">class</span> <span class="class-func-name">FloorOp</span>

A class for representing the floor operator

The `FloorOp` class is used to represent the floor operator.
The number of dimensions of the operand is zero.

Attributes
-----------
- `operand`: The operand.

Note
-----
The `FloorOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">GreaterThanEqualOp</span>

A class for representing the greater than equal operator

The `GreaterThanEqualOp` class is used to represent the greater than equal operator (`>=`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `GreaterThanEqualOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">GreaterThanOp</span>

A class for representing the greater than operator

The `GreaterThanOp` class is used to represent the greater than operator (`>`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `GreaterThanOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">IntegerVar</span>

A class for creating an integer variable

The IntegerVar class is used to create an integer variable.
The lower and upper bounds of the variable can be specified by:
- an integer value
- a float value
- a scalar expression that does not contains any decision variable
- a Placeholder object whose dimensionality is equal to that of this variable.
- a subscripted variable whose dimensionality is equal to that of this variable.

The index operator (`[]`) of a variable with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the integer variable.
- `shape` (`tuple`): A tuple with the size of each dimension of the integer variable. Empty if the variable is not multi-dimensional.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `description` (`str`): A description of the integer variable.

Args
-----
- `name` (`str): A name of the integer variable.
- `shape` (`list | tuple`): A sequence with the size of each dimension of the integer variable. Defaults to an empty tuple (a scalar value).
  - Each item in `shape` must be a valid expression evaluating to a non-negative scalar.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `latex` (`str`, optional): A LaTeX-name of the integer variable to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the integer variable.

Raises
-------
`ModelingError`: Raises if a bound is a `Placeholder` or `Subscript` object whose `ndim`
is neither `0` nor the same value as `ndim` of the integer variable.

Examples
---------
Create a scalar integer variable whose name is "z" and domain is `[-1, 1]`.

```python
>>> import jijmodeling as jm
>>> z = jm.IntegerVar("z", lower_bound=-1, upper_bound=1)

```

Create a 2-dimensional integer variable...
- whose name is "x".
- whose domain is [0, 2].
- where each dimension has length 2 (making this a 2x2 matrix).

```python
>>> import jijmodeling as jm
>>> x = jm.IntegerVar("x", shape=[2, 2], lower_bound=0, upper_bound=2)

```

Create a 1-dimensional integer variable with the index of `123`.

```python
>>> import jijmodeling as jm
>>> x = jm.IntegerVar("x", shape=[124], lower_bound=0, upper_bound=2)
>>> x[123]
IntegerVar(name='x', shape=[NumberLit(value=124)], lower_bound=NumberLit(value=0), upper_bound=NumberLit(value=2))[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Interpreter</span>

Interpreter of the JijModeling AST

This class is responsible for

- Creating OMMX instance from the AST.
  - This means this module also has responsible to register decision variable ID for each decision variables in AST.
- Manage instance data to be substituted into the `Placeholder`.


### Examples


```python


Create a new interpreter with scalar instance data


Insert instance data after creating the interpreter


Python list and numpy array are supported


JaggedArray, non-uniform multi-dimensional array is also supported


You can get the instance data by using get_instance_data method

1.0

Array are normalized to numpy array

array([3., 4.])

array([3., 4.])

<jijmodeling.JaggedArray object at 0x...>

```



---
## <span class="class-func-prefix">class</span> <span class="class-func-name">InterpreterError</span>

Error while interpreting the model.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">JaggedArray</span>

Jagged array, a multi-dimensional array where each element can be an array of different length.


### Examples


```python


# Three dimensional


# __getitem__ works


# out of range

Traceback (most recent call last):
 ...
IndexError: Invalid index

# dimension mismatch

Traceback (most recent call last):
 ...
IndexError: Invalid index



```



---
## <span class="class-func-prefix">class</span> <span class="class-func-name">LessThanEqualOp</span>

A class for representing the less than equal operator

The `LessThanEqualOp` class is used to represent the less than equal operator (`<=`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `LessThanEqualOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">LessThanOp</span>

A class for representing the less than operator

The `LessThanOp` class is used to represent the less than operator (`<`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `LessThanOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">LnOp</span>

A class for representing the natural logarithm

The `LnOp` class is used to represent the natural logarithm.
The number of dimensions of the operand is zero.

Attributes
-----------
`operand`: The operand.

Note
-----
The `LnOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Log10Op</span>

A class for representing the base 10 logarithm

The `Log10Op` class is used to represent the base 10 logarithm.
The number of dimensions of the operand is zero.

Attributes
-----------
- `operand`: The operand.

Note
-----
The `Log10Op` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Log2Op</span>

A class for representing the base 2 logarithm

The `Log2Op` class is used to represent the base 2 logarithm.
The number of dimensions of the operand is zero.

Attributes
-----------
`operand`: The operand.

Note
-----
The `Log2Op` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">MaxOp</span>

A class for representing the maximum value.

The MaxOp class is used to represent the minimum value of operands.
The number of dimensions of each operand is zero.

Attributes
-----------
- `terms`: A sequence of operands.

Note
-----
The `MaxOp` class does not have a constructor. Its intended
instantiation method is by calling the `max` function.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">MeasuringTime</span>

A class for storing time to be measured.

Attributes
-----------
- `solve` (`SolvingTime`): Time to solve the problem.
- `system` (`SystemTime`): Time to measure system time.
- `total` (`float`, optional): Total time to solve the problem. Defaults to None.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">MinOp</span>

A class for representing the minimum value.

The `MinOp` class is used to represent the minimum value of operands.
The number of dimensions of each operand is zero.

Attributes
-----------
- `terms`: A sequence of operands.

Note
-----
The `MinOp` class does not have a constructor. Its intended
instantiation method is by calling the `min` function.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ModOp</span>

A class for representing modulo

The `ModOp` class is used to represent modulo (or remainder) (`%`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `ModOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ModelingError</span>

Error while creating a model.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">MulOp</span>

A class for representing multiplication

The `MulOp` class is used to represent multiplication (`*`) of an arbitrary number of operands.
For example `a * b * c * d` would be one AddOp object.
The number of dimensions of each operand is zero.

Attributes
-----------
`terms`: A sequence of operands to be multiplied.

Note
-----
The `MulOp` class does not have a constructor. Its intended
instantiation method is by calling the multiplication operation on other
expressions.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">NotEqualOp</span>

A class for representing the not equal operator

The `NotEqualOp` class is used to represent the not equal operator (`!=`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `left`: The left-hand operand.
- `right`: The right-hand operand.

Note
-----
The `NotEqualOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">NumberLit</span>

A class for creating a number literal

The `NumberLit` class is used to create a number literal.
Its instance is automatically generated by the return value of
arithmetic or mathematical functions taking a number literal and
an object defined by `jijmodeling` as arguments.

Attributes
-----------
- `value` (`int | float`): A numeric value.
- `dtype` (`DataType`): A type of the value.
  - `dtype` is `DataType.INTEGER` if the type of the value is integer else `dtype` is `DataType.FLOAT`.

Args
-----
- `value` (`int | float`): A numeric value.

Examples
---------
Create a number literal with a integer value `123`.

```python
>>> import jijmodeling as jm
>>> v = jm.NumberLit(123)
>>> assert v.value == 123
>>> assert v.dtype == jm.DataType.INTEGER

```

Create a number literal with a float value `1.23`.

```python
>>> import jijmodeling as jm
>>> v = jm.NumberLit(1.23)
>>> assert v.value == 1.23
>>> assert v.dtype == jm.DataType.FLOAT

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">OrOp</span>

A class for representing logical OR

The `OrOp` class is used to represent logical OR (`|`) of an arbitrary number of operands.
For example `a | b | c | d` would be one `OrOp` object.
The number of dimensions of each operand is zero.

Attributes
-----------
- `terms`: A sequence of operands to apply the OR operation.

Note
-----
The `OrOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Placeholder</span>

A class for creating a placeholder

The Placeholder class is used to create a placeholder.
It is a symbol to be replaced by a numerical value when you solve an optimization problem.

The index operator (`[]`) of a placeholder with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the placeholder.
- `ndim` (`int`): The number of dimensions of the placeholder.
- `description` (`str`, optional): A description of the placeholder.

Args
-----
- `name` (`str`): A name of the placeholder.
- `ndim` (`int`): The number of dimensions of the placeholder. Defaults to `0`. The `ndim` must be set to a non-negative value.
- `latex` (`str`, optional): A LaTeX-name of the placeholder to be represented in Jupyter notebook.
  It is set to `name` by default.
- `description` (`str`, optional): A description of the placeholder.

Raises
-------
- `TypeError`: Raises if set a float value to `ndim`.
- `OverflowError`: Raises if set a negative value to `ndim`.

Examples
---------
Create a scalar (or `ndim` is `0`) placeholder whose name is "a".

```python
>>> import jijmodeling as jm
>>> a = jm.Placeholder("a")

```

Create a 2-dimensional placeholder whose name is "m".

```python
>>> import jijmodeling as jm
>>> m = jm.Placeholder("m", ndim=2)

```

Create a 1-dimensional placeholder with the index of `123`.

```python
>>> import jijmodeling as jm
>>> a = jm.Placeholder("a", ndim=2)
>>> a[123]
Placeholder(name='a', ndim=2)[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">PowOp</span>

A class for representing the power operator

The ModOp class is used to represent the power operator(`**`).
The number of dimensions of each operand is zero.

Attributes
-----------
- `base`: The base operand.
- `exponent`: The exponent operand.

Note
-----
The `PowOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Problem</span>

A class for creating an optimization problem

The Problem class is used to create an optimization problem.

Attributes
-----------
- `name` (`str`): A name of the optimization problem.
- `sense`: Sense of the optimization problem.
- `objective`: The objective function of the optimization problem.
- `constraints` (`dict`): A dictionary that stores constraints.
  - A key is the name of a constraint and the value is the constraint object.
- `custom_penalty_terms` (`dict`): A dictionary that stores custom penalty terms.
  - A key is the name of a custom penalty and the value is the custom penalty object.

Args
-----
- `name` (`str`): A name of the optimization problem.
- `sense` (optional): Sense of the optimization problem. Defaults to `ProblemSense.MINIMIZE`.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ProblemSense</span>

An optimization sense




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ProdOp</span>

A class for representing product

The `ProdOp` class is used to represent product.
The number of dimensions of the opreand is zero.

Attributes
-----------
- `index`: The index of product.
- `condition`: The condition for the product index.
- `operand`: The opreand.

Note
-----
The `ProdOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ProtobufDeserializationError</span>

Failed to decode the buffer to an instance.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">ProtobufSerializationError</span>

Failed to encode the object to a buffer.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Range</span>

A class representing a half-open interval.

The `Range` class is used to represent a half-open interval `[start, end)`.
This class does not have a constructor because it should be created by the Element class.

Attributes
-----------
- `start`: The lower bound of the range (inclusive).
- `end`: The upper bound of the range (exclusive).

Note
-----
This class does not contain any decision variable.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Record</span>

A class for representing a record.

There are two types of solutions that can be given; dense solutions and sparse solutions.
A dense solution is a dict whose key is a variable name and the value is a list of numpy.ndarray.
A sparse solution is a dict whose key is a variable name and the value is a list of tuples with three elements,
where the first element is a list of indices, the second element is a list of non-zero values, and the third element is a shape of the array.
The length of the list of solutions must be the same as the length of the list of num_occurrences.
Each index of the list of solutions corresponds to the same index of the list of non-zero values.

As an example, consider the following solutions:

```text
{
    "x": [
        np.array([[0.0, 1.0, 0.0], [2.0, 0.0, 3.0]]),
        np.array([[1.0, 0.0, 0.0], [2.0, 3.0, 4.0]])
    ],
    "y": [
        np.array([0.0, 0.0, 1.0]),
        np.array([0.0, 1.0, 0.0])
    ]
}
```

This is a dense solution. The corresponding sparse solution is as follows:

```text
{
    "x": [
        (([0, 1, 1], [1, 0, 2]), [1.0, 2.0, 3.0], (2, 3)),
        (([0, 1, 1, 1], [0, 0, 1, 2]), [1.0, 2.0, 3.0, 4.0], (2, 3))
    ],
    "y": [
        (([2],), [1.0], (3,)),
        (([1],), [1.0], (3,))
    ]
}
```

Attributes
-----------
- `solution` (`Union[Dict[str, List[numpy.ndarray]], Dict[str, List[Tuple[List[int], List[float], Tuple[int, ...]]]]]`): A solution.
- `num_occurrences` (`List[int]`): A list of the number of occurrences in which the solution is observed.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SampleSet</span>

A class for storing time of jijzept running.

Attributes
-----------
- `post_problem_and_instance_data` (`float`, optional): Time to upload problem and instance_data to blob. Defaults to `None`.
- `request_queue` (`float`, optional): Time to send request to queue. Defaults to `None`.
- `fetch_problem_and_instance_data` (`float`, optional): Time to fetch problem and `instance_data` from blob. Defaults to `None`.
- `fetch_result` (`float`, optional): Time to fetch result. Defaults to `None`.
- `deserialize_solution` (`float`, optional): Time to deserialize json object. Defaults to `None`.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SemiContinuousVar</span>

A class for creating a semi-continuous variable

The SemiContinuousVar class is used to create a semi-continuous variable.
Either the lower bound or the upper bound is set by the following object:
- an integer value
- a float value
- a scalar expression that does not contains any decision variable
- a Placeholder object whose dimensionality is equal to that of this variable.
- a subscripted variable whose dimensionality is equal to that of this variable.

The index operator (`[]`) of a semi-continuous variable with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the semi-continuous variable.
- `shape` (`tuple`): A tuple with the size of each dimension of the semi-continuous variable. Empty if the variable is not multi-dimensional.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `description` (`str`): A description of the semi-continuous variable.

Args
-----
- `name` (`str`): A name of the semi-continuous variable.
- `shape` (`list | tuple`): A sequence with the size of each dimension of the binary variable. Defaults to an empty tuple (a scalar value).
  - Each item in `shape` must be a valid expression evaluating to a non-negative scalar.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `latex` (`str`, optional): A LaTeX-name of the semi-continuous variable to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the semi-continuous variable.

Raises
-------
`ModelingError`: Raises if a bound is a `Placeholder` or `Subscript` object whose `ndim`
is neither `0` nor the same value as `ndim` of the semi-continuous variable.

Examples
---------
Create a scalar semi-continuous variable whose name is "z" and domain is `[-1, 1]`.

```python
>>> import jijmodeling as jm
>>> z = jm.SemiContinuousVar("z", lower_bound=-1, upper_bound=1)

```

Create a 2-dimensional semi-continuous variable...
- whose name is "x".
- whose domain is `[0, 2]`.
- where each dimension has length 2 (making this a 2x2 matrix).

```python
>>> import jijmodeling as jm
>>> x = jm.SemiContinuousVar("x", shape=[2, 2], lower_bound=0, upper_bound=2)

```

Create a 1-dimensional semi-continuous variable with the index of `123`.

```python
>>> import jijmodeling as jm
>>> x = jm.SemiContinuousVar("x", shape=[124], lower_bound=0, upper_bound=2)
>>> x[123]
SemiContinuousVar(name='x', shape=[NumberLit(value=124)], lower_bound=NumberLit(value=0), upper_bound=NumberLit(value=2))[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SemiIntegerVar</span>

A class for creating a semi-integer variable

The `SemiIntegerVar` class is used to create a semi-integer variable.
The lower and upper bounds of the variable can be specified by:
- an integer value
- a float value
- a scalar expression that does not contains any decision variable
- a Placeholder object whose dimensionality is equal to that of this variable.
- a subscripted variable whose dimensionality is equal to that of this variable.

The index operator (`[]`) of a semi-integer variable with `ndim >= 1` returns a `Subscript` object.

Attributes
-----------
- `name` (`str`): A name of the semi-integer variable.
- `shape` (`tuple`): A tuple with the size of each dimension of the integer variable. Empty if the variable is not multi-dimensional.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `description` (`str`): A description of the semi-integer variable.

Args
-----
- `name` (`str`): A name of the semi-integer variable.
- `shape` (`list | tuple`): A sequence with the size of each dimension of the integer variable. Defaults to an empty tuple (a scalar value).
  - Each item in `shape` must be a valid expression evaluating to a non-negative scalar.
- `lower_bound`: The lower bound of the variable.
- `upper_bound`: The upper bound of the variable.
- `latex` (`str`, optional): A LaTeX-name of the semi-integer variable to be represented in Jupyter notebook.
  - It is set to `name` by default.
- `description` (`str`, optional): A description of the semi-integer variable.

Raises
-------
`ModelingError`: Raises if a bound is a `Placeholder` or `Subscript` object whose `ndim` is neither `0`
nor the same value as `ndim` of the semi-integer variable.

Examples
---------
Create a scalar semi-integer variable whose name is "z" and domain is `[-1, 1]`.

```python
>>> import jijmodeling as jm
>>> z = jm.SemiIntegerVar("z", lower_bound=-1, upper_bound=1)

```

Create a 2-dimensional semi-integer variable...

- whose name is "x".
- whose domain is `[0, 2]`.
- where each dimension has length 2 (making this a 2x2 matrix).

```python
>>> import jijmodeling as jm
>>> x = jm.SemiIntegerVar("x", shape=[2, 2], lower_bound=0, upper_bound=2)

```

Create a 1-dimensional semi-integer variable with the index of `123`.

```python
>>> import jijmodeling as jm
>>> x = jm.SemiIntegerVar("x", shape=[124], lower_bound=0, upper_bound=2)
>>> x[123]
SemiIntegerVar(name='x', shape=[NumberLit(value=124)], lower_bound=NumberLit(value=0), upper_bound=NumberLit(value=2))[NumberLit(value=123)]

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SolvingTime</span>

A class for storing time to solve a problem.

Attributes
-----------
- `preprocess` (`float`, optional): Time to preprocess the problem. Defaults to None.
- `solve` (`float`, optional): Time to solve the problem. Defaults to None.
- `postprocess` (`float`, optional): Time to postprocess the problem. Defaults to None.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Subscript</span>

A class for representing a subscripted variable

The Subscript class is used to represent a variable with subscriptions.

Attributes
-----------
- `variable`: A variable that has subscripts.
- `subscripts` (`list`): A list of subscripts.
- `ndim` (`int`): The number of dimensions of the subscripted variable.

Note
-----
The Subscript class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SumOp</span>

A class for representing summation

The `SumOp` class is used to represent summation.
The number of dimensions of the opreand is zero.

Attributes
-----------
- `index`: The index of summation.
- `condition`: The condition for the summation index.
- `operand`: The opreand.

Note
-----
The `SumOp` class does not have a constructor.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">SystemTime</span>

A class for storing time of jijzept running.

Attributes
-----------
- `post_problem_and_instance_data` (`float`, optional): Time to upload problem and instance_data to blob. Defaults to None.
- `request_queue` (`float`, optional): Time to send request to queue. Defaults to None.
- `fetch_problem_and_instance_data` (`float`, optional): Time to fetch problme and instance_data from blob. Defaults to None.
- `fetch_result` (`float`, optional): Time to fetch result. Defaults to None.
- `deserialize_solution` (`float`, optional): Time to deserialize json object. Defaults to None.




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">XorOp</span>

A class for representing logical XOR

The `XorOp` class is used to represent logical XOR (`^`) of an arbitrary number of operands.
For example `a ^ b ^ c ^ d` would be one `XorOp` object.
The number of dimensions of each operand is zero.

Attributes
-----------
- `terms- `: A sequence of operands to apply the XOR operation.

Note
-----
The `XorOp` class does not have a constructor.



