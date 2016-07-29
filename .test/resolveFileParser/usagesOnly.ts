@ClassDecorator
class Class {
    @PropertyDecorator()
    public notInitializedProperty;

    public typedProperty: TypedPropertyRef;

    public assignedProperty = AssignedProperty;
    
    @FunctionDecorator()
    public func(param: TypedParam, defaultParam = DefaultParam) {
    }

    private prv(): ReturnValue {
        let a = PropertyAccess.To.My.Foobar;

        functionCall(MyProperty);

        indexedObject[Indexing];

        let b;
        b = AssignmentToVariable;

        return null;
    }
}
