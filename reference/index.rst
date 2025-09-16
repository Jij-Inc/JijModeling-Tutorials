JijModeling API Reference
============================

**JijModeling** is a mathematical optimization modeling library that provides an intuitive interface for formulating optimization problems.

Quick Start
===========

.. code-block:: python

   import jijmodeling as jm

   # Create a problem
   problem = jm.Problem("TSP")

   # Define variables
   x = jm.BinaryVar("x", shape=(10, 10))

   # Add objective and constraints
   problem += jm.sum((i, j), x[i, j])  # Objective
   problem += jm.Constraint("example", x.sum() == 1)  # Constraint

API Documentation
=================

Complete automatically generated API documentation:

.. toctree::
   :maxdepth: 4

   apidocs/modules

Indices and Tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
