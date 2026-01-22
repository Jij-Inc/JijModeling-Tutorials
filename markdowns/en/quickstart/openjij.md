---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.0
kernelspec:
  display_name: jijmodeling-tutorial
  language: python
  name: python3
---

# Solving Optimization Problems with OpenJij

To understand how to use `jijmodeling`, let's solve the knapsack problem on this page. However, since `jijmodeling` is a tool for describing mathematical models, it cannot solve optimization problems on its own. Therefore, we will solve it in combination with the mathematical optimization sampler [OpenJij](https://tutorial.openjij.org/en/intro.html).

To use `jijmodeling` with OpenJij, you need to install a Python package called `ommx-openjij-adapter` ([GitHub](https://github.com/Jij-Inc/ommx/tree/main/python/ommx-openjij-adapter), [PyPI](https://pypi.org/project/ommx-openjij-adapter/)). Please install it with the following command:

```bash
pip install ommx-openjij-adapter
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

In this explanation, we will solve an [instance](what_is_instance_openjij) obtained by inputting the following values into the parameters $v_{i}, w_{i}, W$ of the above mathematical model:

| Parameter | Value |
| --- | --- |
| $v_{i}$ | `[10, 13, 18, 31, 7, 15]` |
| $w_{i}$ | `[11, 15, 20, 35, 10, 33]` |
| $W$ | `47` |

(what_is_instance_openjij)=
:::{admonition} What is an instance?
In `jijmodeling`, a dictionary that stores specific values for the parameters of a mathematical model is called "instance data", and a mathematical model with specific values assigned to its parameters is called an "instance".
:::

+++

## Procedure for Generating an Instance

Using `jijmodeling`, you can generate an instance to input into the solver in the following 3 steps:

1. Formulate the knapsack problem
2. Prepare instance data
3. Generate an instance

:::{figure} ../images/model-and-instance-illustrated.svg
:alt: Diagram of the process to generate an instance from a mathematical model
:::

+++

### Step1. Formulate the Knapsack Problem

Formulating the knapsack problem using `jijmodeling` results in the following Python code:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    # Total number of items
    N = problem.Natural("N")
    # Value of items
    v = problem.Natural("v", shape=N)
    # Weight of items
    w = problem.Natural("w", shape=N)
    # Weight capacity of the knapsack
    W = problem.Natural("W")
    # Decision variable: 1 if item i is in the knapsack, 0 otherwise
    x = problem.BinaryVar("x", shape=(N,)) 

    # Objective function
    problem += jm.sum(v[i] * x[i] for i in N)
    # Constraint: Do not exceed the weight capacity of the knapsack
    problem += problem.Constraint("Weight Limit", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{hint}
For more details on how to formulate with `jijmodeling`, please refer to [here](../references/migration_guide_to_jijmodeling2.ipynb).
:::

+++

### Step2. Prepare Instance Data

Next, prepare the instance data for the parameters $v_i, w_i, W$ of the mathematical model formulated in Step1.

```{code-cell} ipython3
instance_data = {
    "N": 6,
    "v": [10, 13, 18, 31, 7, 15],  # Data of item values
    "w": [11, 15, 20, 35, 10, 33], # Data of item weights
    "W": 47,                       # Data of the knapsack's weight capacity
}
```

### Step3. Convert to an Instance

Finally, let's generate an instance using the formulated mathematical model and the prepared instance data.

```{code-cell} ipython3
instance = knapsack_problem.eval(instance_data)
```

:::{hint}
The return value of `Problem.eval` is an `ommx.v1.Instance` object. For more details about it, please refer to [here](https://jij-inc.github.io/ommx/en/user_guide/instance.html).
:::

+++

## Solving the Optimization Problem

Now, let's solve the instance obtained in Step3 with OpenJij's simulated annealing.

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

# Solve the problem via OpenJij and get the solution as ommx.v1.Solution
solution = OMMXOpenJijSAAdapter.solve(
    instance,
    num_reads=100,
    num_sweeps=10,
    uniform_penalty_weight=1.6,
)
```

Using `OMMXOpenJijSAAdapter`, you can easily convert an instance defined by `ommx.v1.Instance` to QUBO/HUBO format using the penalty method or log encoding, and solve it.
Also, the obtained solution can be displayed as a `pandas.DataFrame` object using the `decision_variables_df` property:

```{code-cell} ipython3
df = solution.decision_variables_df
df[df["name"] == "x"][["name", "subscripts", "value"]]
```

:::{note}
Since `OMMXOpenJijSAAdapter` internally performs conversion to QUBO/HUBO format, decision variables may be added from the input instance or the objective function may be changed. Therefore, filtering elements using `pandas.DataFrame` as shown above is necessary.
:::

+++

:::{hint}
The return value of `OMMXPySCIPOptAdapter.solve` is an `ommx.v1.Solution` object. For more details, please refer to [here](https://jij-inc.github.io/ommx/en/user_guide/solution.html).
:::
