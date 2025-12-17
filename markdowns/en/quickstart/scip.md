---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Solving Optimization Problems with SCIP

To understand how to use `jijmodeling`, let's solve the knapsack problem on this page. However, since `jijmodeling` is a tool for describing mathematical models, it cannot solve optimization problems on its own. Therefore, we will solve it in combination with the mathematical optimization solver [SCIP](https://www.scipopt.org/).

To use `jijmodeling` with SCIP, you need to install a Python package called `ommx-pyscipopt-adapter` ([GitHub](https://github.com/Jij-Inc/ommx/tree/main/python/ommx-pyscipopt-adapter), [PyPI](https://pypi.org/project/ommx-pyscipopt-adapter/)). Please install it with the following command:

```bash
pip install ommx-pyscipopt-adapter
```

+++

## Problem Setting

The knapsack problem can be formulated as a mathematical model as follows:

$$
\begin{align*}
\mathrm{maximize} \quad & \sum_{i=0}^{N-1} v_i x_i \\
\mathrm{s.t.} \quad & \sum_{i=0}^{N-1} w_i x_i \leq W, \\
& x_{i} \in \{ 0, 1\} 
\end{align*}
$$

:::{hint}
For more details on the formulation of the knapsack problem, please refer to [here](https://jij-inc.github.io/JijZept-Tutorials/en/src/02_knapsack.html).
:::

The meaning of each parameter in this mathematical model is as follows:

| Parameter | Description |
| --- | --- |
| $N$ |	Total number of items |
| $v_{i}$ | Value of item $i$ |
| $w_{i}$ | Weight of item $i$ |
| $W$ | Weight capacity of the knapsack |

In this explanation, we will solve an [instance](what_is_instance) obtained by inputting the following values into the parameters $v_{i}, w_{i}, W$ of the above mathematical model:

| Parameter | Value |
| --- | --- |
| $v_{i}$ | `[10, 13, 18, 31, 7, 15]` |
| $w_{i}$ | `[11, 15, 20, 35, 10, 33]` |
| $W$ | `47` |

(what_is_instance)=
:::{admonition} What is an instance?
In `jijmodeling`, an instance is a mathematical model with specific values assigned to its parameters.
:::

+++

## Procedure for Generating an Instance

Using `jijmodeling`, you can generate an instance to input into the solver in the following two steps:

1. Formulate the knapsack problem with `jijmodeling`
2. Convert the mathematical model to an instance using the `Problem` object

![Diagram of the process to generate an instance from a mathematical model](./assets/scip_01.png)

+++

## Step1. Formulate the Knapsack Problem with JijModeling

The following Python code formulates the knapsack problem using `jijmodeling`:

```{code-cell} ipython3
import jijmodeling as jm

# JijModeling 2 with Decorator API
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    # Value of items
    v = problem.Natural("v", ndim=1)
    # Weight of items
    w = problem.Natural("w", ndim=1)
    # Weight capacity of the knapsack
    W = problem.Natural("W")
    # Total number of items
    N = v.len_at(0, latex="N")
    # Decision variable: 1 if item i is in the knapsack, 0 otherwise
    x = problem.BinaryVar("x", shape=(N,)) 

    # Objective function
    problem += jm.sum(v[i] * x[i] for i in N)
    # Constraint: Do not exceed the weight capacity of the knapsack
    problem += problem.Constraint("Weight Constraint", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{hint}
For more details on how to formulate with `jijmodeling`, please refer to [here](../references/migration_guide_to_jijmodeling2.ipynb).
:::

+++

## Step2. Convert the Mathematical Model to an Instance Using the `Problem` Object

Prepare the instance data to be assigned to the `Placeholder`s of the mathematical model formulated in Step1, and convert the mathematical model to an instance.

You can register the instance data by passing a dictionary with the following keys and values to the `eval` method of the `Problem` class:

- Key: String set in the `name` property of the `Placeholder` object
- Value: Data to be assigned

The `eval` method registers the instance data and, at the same time, fills the `Placeholder`s held by the `Problem` object with the instance data to convert it into an instance.

```{code-cell} ipython3
instance_data = {
    "v": [10, 13, 18, 31, 7, 15],  # Data of item values
    "w": [11, 15, 20, 35, 10, 33], # Data of item weights
    "W": 47,                       # Data of the knapsack's weight capacity
}
instance = knapsack_problem.eval(instance_data)
```

:::{hint}
The return value of `Problem.eval` is an `ommx.v1.Instance` object. For more details about it, please refer to [here](https://jij-inc.github.io/ommx/en/user_guide/instance.html).
:::

+++

## Solving the Optimization Problem

Now, let's solve the instance obtained in Step2 with the optimization solver SCIP. The following Python code can be used to obtain the optimal value of the objective function:

```{code-cell} ipython3
from ommx_pyscipopt_adapter import OMMXPySCIPOptAdapter

# Solve through SCIP and retrieve results as an ommx.v1.Solution
solution = OMMXPySCIPOptAdapter.solve(instance)

print(f"Optimal value of the objective function: {solution.objective}")
```

In addition, you can display the state of the decision variables as a `pandas.DataFrame` object using the `decision_variables_df` property of `solution`:

```{code-cell} ipython3
solution.decision_variables_df[["name", "subscripts", "value"]]
```

:::{hint}
`OMMXPySCIPOptAdapter.solve` returns an `ommx.v1.Solution` object. For more information, see [here](https://jij-inc.github.io/ommx/en/user_guide/solution.html).
:::
